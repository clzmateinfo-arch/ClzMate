import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/entities/auth/model/authAPI";
import { NavbarLinks } from "@/app/config/navbar-links";
import DesktopCenterNav from "./components/DesktopCenterNav";
import MobileNav from "./components/MobileNav";
import ProfileMenu from "./components/ProfileMenu";

const MainNavbar = () => {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pathname = location?.pathname || "/";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [centerDropdownOpen, setCenterDropdownOpen] = useState(null);

  useEffect(() => {
    setMobileOpen(false);
    setCenterDropdownOpen(null);
  }, [pathname]);

  const openDropdown = useCallback((title) => setCenterDropdownOpen((s) => (s === title ? null : title)), []);
  const closeDropdown = useCallback((title) => setCenterDropdownOpen((s) => (s === title ? null : s)), []);

  const handleSignOut = useCallback(() => {
    dispatch(logout(navigate));
  }, [dispatch, navigate]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[500] w-full bg-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-30">
          {/* <div className="ml-1 relative z-[60] flex-none flex items-center rounded-full bg-white/75 bg-gradient-to-r from-pink-300/40 via-violet-300/40 to-indigo-300/40 border border-white/50 text-sm font-medium text-gray-800 shadow-lg shadow-gray-800/5 ring-1 ring-gray-800/[.075] backdrop-blur-xl px-0">
            <Logo onClick={() => setMobileOpen(false)} className="" />
          </div> */}
          <button
            onClick={() => setMobileOpen((s) => !s)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close main menu" : "Open main menu"}
            className="ml-auto xl:hidden relative z-[60] rounded-full flex-none flex items-center justify-center w-11 h-11 mr-2 transition-colors bg-white/75 bg-gradient-to-r from-pink-200/40 via-violet-200/40 to-indigo-200/40 border border-white/50 px-2 text-sm shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-400/5"
          >
            {!mobileOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 6h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <div className="pointer-events-auto flex lg:flex xl:w-full items-center justify-end relative">
            <DesktopCenterNav
              links={NavbarLinks}
              pathname={pathname}
              openDropdown={openDropdown}
              closeDropdown={closeDropdown}
              centerDropdownOpen={centerDropdownOpen}
            />

            <div className="ml-1 flex-none flex items-center rounded-full bg-white/75 bg-gradient-to-r from-pink-200/40 via-violet-200/40 to-indigo-200/40 border border-white/50 text-sm font-medium text-gray-800 shadow-lg shadow-gray-800/5 ring-1 ring-gray-800/[.075] backdrop-blur-xl px-0">
              {!token ? (
                <div className="flex items-center">
                  <Link
                    to="/login"
                    className="ml-1 mt-1 mb-1 flex-none group relative inline-flex items-center bg-clip-padding rounded-l-[20px] rounded-r-[8px] border h-8 pl-3 pr-3 bg-white/40 border-white/90 shadow hover:text-violet-600 hover:bg-violet-50/40 transition-colors duration-300"
                  >
                    <span className="text-sm leading-none">Sign In</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="mr-1 mt-1 mb-1 btn-purple flex-none group relative inline-flex items-center ml-1 h-8 pr-3 pl-3 rounded-r-[20px] rounded-l-[8px] bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              ) : (
                <ProfileMenu user={user} onSignOut={handleSignOut} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`xl:hidden fixed inset-0 z-40 transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} bg-gray-500/25 backdrop-blur-sm`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />

      <MobileNav
        links={NavbarLinks}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pathname={pathname}
        centerDropdownOpen={centerDropdownOpen}
        setCenterDropdownOpen={setCenterDropdownOpen}
        token={token}
        user={user}
        onSignOut={handleSignOut}
      />
    </header>
  );
};

export default MainNavbar;
