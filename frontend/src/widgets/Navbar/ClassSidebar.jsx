import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { HiMenuAlt1 } from "react-icons/hi";
import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { IoMdClose } from "react-icons/io";

import { sidebarLinks } from "@/app/config/class-links";
import { logout } from "@/entities/auth/model/authAPI";
import ConfirmationModal from "@/shared/components/feedback/ConfirmationModal";
import Loading from "@/shared/components/navigation/Loading";
import { setOpenSideMenu, setScreenSize } from "@/entities/ui/sidebarSlice";
import { HiArrowLeftStartOnRectangle, HiHome } from "react-icons/hi2";
import { MdOutlineExitToApp } from "react-icons/md";
import { setDrawMode } from "@/entities/course/model/courseSlice";

export default function ClassSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const paramClassroomId = params?.classroomId;

  const { user, loading: profileLoading } = useSelector((s) => s.profile || {});
  const { loading: authLoading } = useSelector((s) => s.auth || {});
  const { openSideMenu } = useSelector((s) => s.sidebar || {});
  const classroomState = useSelector((s) => s.classroom || {});
  const { drawMode } = useSelector((s) => s.course || {});

  const [confirmationModal, setConfirmationModal] = useState(null);

  useEffect(() => {
    const handleResize = () => dispatch(setScreenSize(window.innerWidth));
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch, location.pathname]);

  const getIdFromPathname = (pathname = "") => {
    try {
      const m = pathname.match(/\/classroom\/([^/]+)/);
      return m ? m[1] : null;
    } catch (e) {
      return null;
    }
  };

  const resolveClassroomId = () => {
    const fromParams = paramClassroomId || null;
    const fromPath = getIdFromPathname(location.pathname) || null;
    const fromStateCurrent = classroomState?.current?._id ?? null;
    const fromListFirst = Array.isArray(classroomState?.list) && classroomState.list.length > 0 ? classroomState.list[0]._id : null;
    const fromLocal = typeof window !== "undefined" ? localStorage.getItem("currentClassroomId") : null;

    return fromParams || fromPath || fromStateCurrent || fromLocal || fromListFirst || null;
  };

  const resolveLinkPath = (rawPath) => {
    if (!rawPath) return null;

    if (String(rawPath).includes(":classroomId")) {
      const id = resolveClassroomId();
      if (!id) return null;
      const replaced = String(rawPath).replace(":classroomId", id);
      if (replaced.includes(":")) return null;
      return replaced.startsWith("/") ? replaced : `/${replaced}`;
    }

    return rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  };

  const safeNavigate = (pathOrDelta) => {
    dispatch(setOpenSideMenu(false));
    if (typeof pathOrDelta === "number") {
      navigate(pathOrDelta);
      return;
    }
    if (!pathOrDelta || String(pathOrDelta).includes(":")) {
      console.warn("ClassSidebar.safeNavigate blocked invalid path:", pathOrDelta);
      toast.error("Invalid navigation target");
      return;
    }
    navigate(pathOrDelta);
  };

  const handleClassLinkClick = (rawPath) => {
    const p = resolveLinkPath(rawPath);
    if (p) {
      safeNavigate(p);
      return;
    }

    const listFirst = Array.isArray(classroomState?.list) && classroomState.list.length > 0 ? classroomState.list[0]._id : null;
    if (listFirst) {
      try { localStorage.setItem("currentClassroomId", listFirst); } catch (e) { console.warn("Could not store currentClassroomId in localStorage", e); }
      const newPath = String(rawPath).replace(":classroomId", listFirst);
      if (newPath.includes(":")) {
        console.warn("Replacement still contains tokens, aborting:", newPath);
        toast.error("Could not resolve classroom");
        navigate("/dashboard/classrooms");
        return;
      }
      safeNavigate(newPath.startsWith("/") ? newPath : `/${newPath}`);
      return;
    }

    toast.error("Open or select a classroom first");
    navigate("/dashboard/classrooms");
  };

  const handleSignOut = useCallback(() => {
    dispatch(logout(navigate));
  }, [dispatch, navigate]);

  if (profileLoading || authLoading) {
    return (
      <div className="grid h-[calc(100vh-3.5rem)] min-w-[64px] items-center">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <nav
        aria-label="Quick links"
        className="fixed right-4 mr-1 top-1/3 z-[99999] flex -translate-y-1/2 flex-col items-center gap-3"
      >
        <button
          aria-controls="full-sidebar"
          onClick={() => safeNavigate("/dashboard")}
          title="Exit"
          className={`group relative mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#59585a] to-[#0f0f0f] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/40`}
        >
          <MdOutlineExitToApp size={18} />
          <span className="flex items-center justify-center min-w-[150px] absolute right-full mr-3 select-none rounded-md px-3 py-1 text-sm font-medium text-white backdrop-blur-sm bg-black/50 border border-white/6 opacity-0 transform translate-x-2 group-hover:flex group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" aria-hidden>
            Exit
          </span>
        </button>

        <button
          aria-controls="full-sidebar"
          onClick={() => safeNavigate("/")}
          title="Home"
          className={`group relative ${openSideMenu ? "mb-10" : "mb-0"} flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#6300b9] to-[#996bec] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/40`}
        >
          <HiHome size={18} />
          <span className="flex items-center justify-center min-w-[150px] absolute right-full mr-3 hidden select-none rounded-md px-3 py-1 text-sm font-medium text-white backdrop-blur-sm bg-black/50 border border-white/6 opacity-0 transform translate-x-2 group-hover:flex group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" aria-hidden>
            Home
          </span>
        </button>

        <button
          aria-expanded={openSideMenu}
          aria-controls="full-sidebar"
          onClick={() => dispatch(setOpenSideMenu(!openSideMenu))}
          title={openSideMenu ? "Close menu" : "Open menu"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#2c0052e1] to-[#421a8d] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/40"
        >
          {openSideMenu ? <IoMdClose size={18} /> : <HiMenuAlt1 size={18} />}
        </button>

        {openSideMenu && (
          <div>
            {sidebarLinks.map((link) => {
              if (link.type && user?.accountType !== link.type) return null;

              const Icon = link.icon;
              const finalPath = resolveLinkPath(link?.path);
              const disabled = !finalPath;

              return (
                <button
                  key={link.id + String(link.type)}
                  title={link.name}
                  aria-label={link.name}
                  onClick={() => {
                    if (!finalPath) {
                      handleClassLinkClick(link?.path);
                      return;
                    }
                    safeNavigate(finalPath);
                  }}
                  className={`group relative flex h-12 w-12 mt-1.5 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/30 ${disabled ? "opacity-60" : "bg-gradient-to-r btn-purple bg-violet-600 hover:bg-violet-700 text-white"}`}
                >
                  <span
                    className="absolute inset-0 -z-10 rounded-full blur-[10px] opacity-80"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(186,123,240,0.14), rgba(80,70,228,0.06))",
                    }}
                    aria-hidden
                  />
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full p-0.5"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                    }}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white transition-transform duration-200 transform group-hover:scale-105 group-hover:rotate-3">
                      {Icon && <Icon size={18} />}
                    </span>
                  </span>
                  <span
                    className="min-w-[150px] items-center justify-center pointer-events-none absolute right-full mr-3 hidden select-none rounded-md px-3 py-1 text-sm font-medium text-white backdrop-blur-sm bg-black/50 border border-white/6 opacity-0 transform translate-x-2 group-hover:block group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                    aria-hidden
                  >
                    {link.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button
          aria-controls="full-sidebar"
          onClick={() => setConfirmationModal({
            text1: "Sign Out",
            text2: "Are you sure you want to sign out?",
            btn1Text: "Sign Out",
            btn2Text: "Cancel",
            btn1Handler: () => { handleSignOut(); setConfirmationModal(null); },
            btn2Handler: () => setConfirmationModal(null),
          })}
          title="Signout"
          className={`group relative mb-3 ${openSideMenu ? "mt-10" : "mt-0"} flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#6300b9] to-[#996bec] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/40`}
        >
          <HiArrowLeftStartOnRectangle size={18} />
          <span className="flex items-center justify-center min-w-[150px] absolute right-full mr-3 hidden select-none rounded-md px-3 py-1 text-sm font-medium text-white backdrop-blur-sm bg-black/50 border border-white/6 opacity-0 transform translate-x-2 group-hover:flex group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" aria-hidden>
            Signout
          </span>
        </button>
      </nav>

      {openSideMenu && (
        <button
          aria-hidden
          onClick={() => dispatch(setOpenSideMenu(false))}
          className={`opacity-100 pointer-events-auto fixed inset-0 z-40 transition-all duration-300 bg-gray-500/25 backdrop-blur-sm`}
        />
      )}

      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  );
}
