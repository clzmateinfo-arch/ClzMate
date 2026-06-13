import { useRef, useState } from "react";
import { AiOutlineCaretDown } from "react-icons/ai";
import { VscDashboard, VscSignOut } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import useOnClickOutside from "../../../hooks/useOnClickOutside";
import { logout } from "@/entities/auth/model/authAPI";
import Img from "@/shared/components/ui/Img";
import ConfirmationModal from "@/shared/components/feedback/ConfirmationModal";

export default function ProfileDropdown() {
  const { user } = useSelector((state) => state.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(null);
  const ref = useRef(null);

  useOnClickOutside(ref, () => setOpen(false));

  if (!user) return null;

  return (
    <>
      <button className="relative hidden sm:flex" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-x-1">
          <Img
            src={user?.image}
            alt={`profile-${user?.firstName}`}
            className={"aspect-square w-[30px] rounded-full object-cover"}
          />
          <AiOutlineCaretDown className="text-sm text-black" />
        </div>

        {open && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-[118%] right-0 z-[1000] divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
            ref={ref}
          >
            <Link to="/dashboard" onClick={() => setOpen(false)}>
              <div className="flex w-full items-center gap-x-1 py-[10px] px-[12px] text-sm text-black hover:text-black">
                <VscDashboard className="text-lg" />
                Dashboard
              </div>
            </Link>

            <div
              onClick={() => {
                setConfirmationModal({
                  text1: "Sign Out",
                  text2: "Are you sure you want to sign out?",
                  btn1Text: "Sign Out",
                  btn2Text: "Cancel",
                  btn1Handler: () => { dispatch(logout(navigate)); setConfirmationModal(null); },
                  btn2Handler: () => setConfirmationModal(null),
                });
                setOpen(false);
              }}
              className="flex w-full items-center gap-x-1 py-[10px] px-[12px] text-sm text-black hover:text-black"
            >
              <VscSignOut className="text-lg" />
              Logout
            </div>
          </div>
        )}
      </button>

      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  );
}
