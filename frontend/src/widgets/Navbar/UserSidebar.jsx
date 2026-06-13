 
import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { HiMenuAlt1 } from "react-icons/hi"
import { IoMdClose } from "react-icons/io"

import { sidebarLinks } from "@/app/config/dashboard-links"
import { logout } from "@/entities/auth/model/authAPI"
import ConfirmationModal from "@/shared/components/feedback/ConfirmationModal"
import Loading from "@/shared/components/navigation/Loading"
import { setOpenSideMenu, setScreenSize } from "@/entities/ui/sidebarSlice"
import { HiArrowLeftStartOnRectangle, HiHome } from "react-icons/hi2"

export default function UserSidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, loading: profileLoading } = useSelector((s) => s.profile)
  const { loading: authLoading } = useSelector((s) => s.auth)
  const { openSideMenu } = useSelector((s) => s.sidebar)
  const [confirmationModal, setConfirmationModal] = useState(null)

  useEffect(() => {
    const handleResize = () => dispatch(setScreenSize(window.innerWidth))
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [dispatch])

  const handleSignOut = useCallback(() => {
    dispatch(logout(navigate));
  }, [dispatch, navigate]);

  if (profileLoading || authLoading) {
    return (
      <div className="grid h-[calc(100vh-3.5rem)] min-w-[64px] items-center">
        <Loading />
      </div>
    )
  }

  const handleNavigate = (path) => {
    if (path) {
      dispatch(setOpenSideMenu(false))
      navigate(path)
    }
  }

  return (
    <>
      <nav
        aria-label="Quick links"
        className="fixed right-4 mr-1 top-1/3 z-[99999] flex -translate-y-1/2 flex-col items-center gap-3"
      >
        <button
          aria-controls="full-sidebar"
          onClick={() => handleNavigate("/")}
          title="Home"
          className={`group relative mt-3 ${openSideMenu ? "mb-10" : "mb-0"
            } flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#6300b9] to-[#996bec] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/40`}
        >
          <HiHome size={18} />
          <span
            className="flex items-center justify-center min-w-[150px] absolute right-full mr-3 hidden select-none rounded-md px-3 py-1 text-sm font-medium text-white backdrop-blur-sm bg-black/50 border border-white/6 opacity-0 transform translate-x-2 group-hover:flex group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
            aria-hidden
          >
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
              if (link.type && user?.accountType !== link.type) return null

              const Icon = link.icon

              return (
                <button
                  key={link.id}
                  title={link.name}
                  aria-label={link.name}
                  onClick={() => handleNavigate(link?.path)}
                  className="bg-gradient-to-r btn-purple bg-violet-600 hover:bg-violet-700 text-white group relative flex h-12 w-12 mt-1.5 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/30"
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
              )
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
          className={`group relative mb-3 ${openSideMenu ? "mt-10" : "mt-0"
            } flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#6300b9] to-[#996bec] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba7bf0]/40`}
        >
          <HiArrowLeftStartOnRectangle size={18} />
          <span
            className="flex items-center justify-center min-w-[150px] absolute right-full mr-3 hidden select-none rounded-md px-3 py-1 text-sm font-medium text-white backdrop-blur-sm bg-black/50 border border-white/6 opacity-0 transform translate-x-2 group-hover:flex group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
            aria-hidden
          >
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
  )
}
