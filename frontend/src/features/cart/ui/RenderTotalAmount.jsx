import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Button from "@/shared/components/ui/Button";
import ConfirmationModal from "@/shared/components/feedback/ConfirmationModal";
import { buyCourse } from "@/entities/student/model/studentFeaturesAPI";

export default function RenderTotalAmount() {
  const { total, cart } = useSelector((state) => state.cart);
  const { token } = useSelector((state) => state.auth || {});
  const { user } = useSelector((state) => state.profile || {});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [confirmationModal, setConfirmationModal] = useState(null);

  const handleBuyCourse = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!cart.length) return;

    setConfirmationModal({
      text1: "Confirm Purchase",
      text2: `Proceed to buy ${cart.length} course(s) for ₹ ${Number(total ?? 0).toLocaleString()}?`,
      btn1Text: "Buy Now",
      btn2Text: "Cancel",
      btn1Handler: async () => {
        setConfirmationModal(null);
        const courses = cart.map((course) => course._id);
        await buyCourse(token, courses, false, user, navigate, dispatch);
      },
      btn2Handler: () => setConfirmationModal(null),
    });
  };

  return (
    <>
      <div className="min-w-[280px] rounded-2xl border border-black/10 p-6">
        <p className="mb-1 text-sm font-medium text-black/60">Total:</p>
        <p className="mb-6 text-3xl font-medium text-black">₹ {Number(total ?? 0).toLocaleString()}</p>
        <Button onClick={handleBuyCourse} className="w-full justify-center">
          Buy Now
        </Button>
      </div>
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  );
}
