/* eslint-disable react/prop-types */
import { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import useOnClickOutside from "../../../hooks/useOnClickOutside";
import Img from "@/shared/components/ui/Img";
import { logout } from "@/entities/auth/model/authAPI";
import { VscDashboard, VscSignOut } from "react-icons/vsc";
import { AiOutlineCaretDown, AiOutlineHome } from "react-icons/ai";
import { MdOutlineContactPhone } from "react-icons/md";
import { TbMessage2Plus } from "react-icons/tb";
import { PiNotebook } from "react-icons/pi";
import { fetchCourseCategories } from "@/entities/course/model/courseDetailsAPI";

export default function MobileProfileDropDown() {
  const { user } = useSelector((state) => state.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [subLinks, setSubLinks] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);

  useOnClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    const doFetch = async () => {
      try {
        setLoading(true);
        const res = await fetchCourseCategories();
        setSubLinks(res);
      } catch (error) {
        console.log("Could not fetch the category list = ", error);
      }
      setLoading(false);
    };
    doFetch();
  }, []);

  if (!user) return null;

  return (
    <button className="relative sm:hidden" onClick={() => setOpen(true)}>
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
          className="absolute min-w-[120px] top-[118%] right-0 z-[1000] divide-y-[1px] divide-black overflow-hidden rounded-lg border-[1px] border-black "
          ref={ref}
        >
          <Link to="/dashboard" onClick={() => setOpen(false)}>
            <div className="flex w-full items-center gap-x-1 py-[10px] px-[12px] text-sm text-black">
              <VscDashboard className="text-lg" />
              Dashboard
            </div>
          </Link>

          <Link to="/" onClick={() => setOpen(false)}>
            <div className="flex w-full items-center gap-x-1 py-[10px] px-[12px] text-sm text-black border-y border-black ">
              <AiOutlineHome className="text-lg" />
              Home
            </div>
          </Link>

          <Link to="/" onClick={() => setOpen(false)}>
            <div className="flex w-full items-center gap-x-1 py-[10px] px-[12px] text-sm text-black">
              <PiNotebook className="text-lg" />
              Catalog
            </div>
          </Link>

          <Link to="/about" onClick={() => setOpen(false)}>
            <div className="flex w-full items-center gap-x-1 py-[10px] px-[12px] text-sm text-black border-y border-black ">
              <TbMessage2Plus className="text-lg" />
              About Us
            </div>
          </Link>

          <Link to="/contact" onClick={() => setOpen(false)}>
            <div className="flex w-full items-center gap-x-1 py-[10px] px-[12px] text-sm text-black ">
              <MdOutlineContactPhone className="text-lg" />
              Contact Us
            </div>
          </Link>

          <div
            onClick={() => {
              dispatch(logout(navigate));
              setOpen(false);
            }}
            className="flex w-full items-center gap-x-1 py-[10px] px-[12px] text-sm text-black"
          >
            <VscSignOut className="text-lg" />
            Logout
          </div>
        </div>
      )}
    </button>
  );
}
