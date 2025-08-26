/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { VscSignOut } from "react-icons/vsc";
import { HiMenuAlt1 } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { MdOutlineSettings } from "react-icons/md";
import { FiCircle } from "react-icons/fi";

import { sidebarLinks } from "@/app/config/dashboard-links";
import { logout } from "@/entities/auth/model/authAPI";
import ConfirmationModal from "@/shared/components/feedback/ConfirmationModal";
import SidebarLink from "@/shared/components/navigation/SidebarLink";
import Loading from "@/shared/components/navigation/Loading";
import { setOpenSideMenu, setScreenSize } from "@/entities/ui/sidebarSlice";

/**
 * FixedIconSidebar
 * - Left-side fixed vertical icon rail (compact)
 * - Toggle button (fixed) to show/hide full sidebar (slides in)
 * - Uses gradient icon backgrounds and theme colors
 */

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading: profileLoading } = useSelector((s) => s.profile);
  const { loading: authLoading } = useSelector((s) => s.auth);
  const { openSideMenu, screenSize } = useSelector((s) => s.sidebar);

  const [confirmationModal, setConfirmationModal] = useState(null);

  // safe icon map for string icon names - extend if you use other string names
  const ICON_MAP = {
    VscSignOut,
    HiMenuAlt1,
    IoMdClose,
    VscSettingsGear: MdOutlineSettings,
    Settings: MdOutlineSettings,
  };

  useEffect(() => {
    const handleResize = () => dispatch(setScreenSize(window.innerWidth));
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  // auto-hide the full sidebar on small screens (keeps compact rail)
  useEffect(() => {
    if (screenSize <= 640) {
      dispatch(setOpenSideMenu(false));
    } else {
      // keep open on larger screens if previously open
      dispatch(setOpenSideMenu(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenSize]);

  if (profileLoading || authLoading) {
    return (
      <div className="grid h-[calc(100vh-3.5rem)] min-w-[64px] items-center  border-r border-r-black">
        <Loading />
      </div>
    );
  }

  const handleNavigate = (link) => {
    // If the link is an external action (like logout), handle specially
    if (link?.action === "logout") {
      setConfirmationModal({
        text1: "Are you sure?",
        text2: "You will be logged out of your account.",
        btn1Text: "Logout",
        btn2Text: "Cancel",
        btn1Handler: () => {
          dispatch(logout(navigate));
          setConfirmationModal(null);
        },
        btn2Handler: () => setConfirmationModal(null),
      });
      return;
    }

    // navigate to path (if present)
    if (link?.path) {
      navigate(link.path);
      // close slide-in menu on small devices after navigation
      if (screenSize <= 1024) dispatch(setOpenSideMenu(false));
    }
  };

  const renderIcon = (iconProp, props = {}) => {
    if (!iconProp) return <FiCircle {...props} />;
    if (typeof iconProp === "function") {
      const IconComp = iconProp;
      return <IconComp {...props} />;
    }
    if (typeof iconProp === "string" && ICON_MAP[iconProp]) {
      const IconComp = ICON_MAP[iconProp];
      return <IconComp {...props} />;
    }

    return <FiCircle {...props} />;
  };

  return (
    <>
      <nav
        aria-label="Quick links"
        className="fixed left-4 top-1/3 z-[60] flex -translate-y-1/2 flex-col items-center gap-3"
      >
        {sidebarLinks.map((link) => {
          if (link.type && user?.accountType !== link.type) return null;

          return (
            <button
              key={link.id}
              title={link.name}
              aria-label={link.name}
              onClick={() => handleNavigate(link)}
              className="group relative flex h-12 w-12 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/40"
            >
              {/* gradient circle background */}
              <span
                className="absolute inset-0 -z-10 rounded-full blur-[10px] opacity-80"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(186,123,240,0.18), rgba(153,107,236,0.18) 50%, rgba(80,70,228,0.08))",
                }}
                aria-hidden
              />
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full p-0.5"
                style={{
                  background:
                    "linear-gradient(135deg, #ba7bf0, #996bec 50%, #5046e4)",
                }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full /85 text-white">
                  {renderIcon(link.icon, { size: 18 })}
                </span>
              </span>

              {/* subtle label on hover (desktop) */}
              <span className="pointer-events-none absolute left-full ml-3 hidden rounded-md /90 px-3 py-1 text-sm text-white group-hover:block">
                {link.name}
              </span>
            </button>
          );
        })}

        {/* sign-out button in the compact rail */}
        <button
          key="signout-compact"
          title="Logout"
          aria-label="Logout"
          onClick={() =>
            setConfirmationModal({
              text1: "Are you sure ?",
              text2: "You will be logged out of your account.",
              btn1Text: "Logout",
              btn2Text: "Cancel",
              btn1Handler: () => {
                dispatch(logout(navigate));
                setConfirmationModal(null);
              },
              btn2Handler: () => setConfirmationModal(null),
            })
          }
          className="group relative mt-1 flex h-12 w-12 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/40"
        >
          <span
            className="absolute inset-0 -z-10 rounded-full blur-[10px] opacity-70"
            style={{
              background:
                "linear-gradient(135deg, rgba(253,93,93,0.14), rgba(246,153,64,0.08))",
            }}
            aria-hidden
          />
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full p-0.5"
            style={{
              background:
                "linear-gradient(135deg, #ff6a88, #ff9472 50%, #fcb045)",
            }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full /85 text-white">
              <VscSignOut size={18} />
            </span>
          </span>
        </button>


        {/* Toggle button: show/hide full sidebar */}
        <button
          aria-expanded={openSideMenu}
          aria-controls="full-sidebar"
          onClick={() => dispatch(setOpenSideMenu(!openSideMenu))}
          title={openSideMenu ? "Close menu" : "Open menu"}
          className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#ba7bf0] to-[#996bec] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/40"
        >
          {openSideMenu ? <IoMdClose size={18} /> : <HiMenuAlt1 size={18} />}
        </button>
      </nav>

      {/* overlay for small devices when sidebar is open */}
      {openSideMenu && screenSize <= 1024 && (
        <button
          aria-hidden
          onClick={() => dispatch(setOpenSideMenu(false))}
          className="fixed inset-0 z-40 bg-black/40"
        />
      )}

      {confirmationModal && (
        <ConfirmationModal modalData={confirmationModal} />
      )}
    </>
  );
}
