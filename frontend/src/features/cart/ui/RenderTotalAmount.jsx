// frontend/src/features/cart/ui/RenderTotalAmount.jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import IconBtn from "@/shared/components/ui/IconBtn";
import { buyCourse } from "@/entities/student/model/studentFeaturesAPI";

export default function RenderTotalAmount() {
  const { total, cart } = useSelector((state) => state.cart);
  const { token } = useSelector((state) => state.auth || {});
  const { user } = useSelector((state) => state.profile || {});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleBuyCourse = async () => {
    if (!token) {
      // require login
      navigate("/login");
      return;
    }

    if (!cart.length) return;

    const confirmed = window.confirm(`Proceed to buy ${cart.length} course(s) for ₹ ${total}?`);
    if (!confirmed) return;

    const courses = cart.map((course) => course._id);
    // Call buyCourse(token, coursesId, requiresApproval, userDetails, navigate, dispatch)
    await buyCourse(token, courses, false, user, navigate, dispatch);
  };

  return (
    <div className="min-w-[280px] rounded-md border-[1px] border-black p-6">
      <p className="mb-1 text-sm font-medium text-black">Total:</p>
      <p className="mb-6 text-3xl font-medium text-yellow-100">₹ {Number(total ?? 0).toLocaleString()}</p>
      <IconBtn
        text="Buy Now"
        onClick={handleBuyCourse}
        customClasses="w-full justify-center bg-violet-600"
      />
    </div>
  );
}
