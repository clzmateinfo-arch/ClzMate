import { Link, matchPath, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { NavbarLinks } from "../../app/config/navbar-links";
import { fetchCourseCategories } from "@/entities/course/model/courseDetailsAPI";
import studyNotionLogo from "@/shared/assets/images/logo/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/entities/auth/model/authAPI";

const Navbar = () => {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const { totalItems } = useSelector((state) => state.cart);

  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pathname = location?.pathname || "/";

  const [subLinks, setSubLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [centerDropdownOpen, setCenterDropdownOpen] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownTimeoutRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchSublinks = async () => {
      try {
        setLoading(true);
        const res = await fetchCourseCategories();
        setSubLinks(res || []);
      } catch (err) {
        console.error("Could not fetch categories:", err);
        setSubLinks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSublinks();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCenterDropdownOpen(null);
    setProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileMenuOpen]);

  const isRouteActive = (link) => {
    if (!link) return false;
    if (link.path === "/") return pathname === "/";
    if (link.title === "Catalog") {
      return pathname === "/catalog" || pathname.startsWith("/catalog/");
    }
    if (link.path) {
      const match = matchPath({ path: link.path, end: true }, pathname);
      return Boolean(match);
    }
    return false;
  };

  const openCenterDropdown = (title) => {
    clearTimeout(dropdownTimeoutRef.current);
    setCenterDropdownOpen(title);
  };

  const closeCenterDropdownSoon = (title) => {
    clearTimeout(dropdownTimeoutRef.current);
    dropdownTimeoutRef.current = setTimeout(() => {
      setCenterDropdownOpen((cur) => (cur === title ? null : cur));
    }, 120);
  };

  const renderAvatar = () => {
    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user?.fullName || "User avatar"}
          className="h-8 w-8 rounded-full object-cover"
        />
      );
    }
    const initials =
      (user?.firstName ? user.firstName[0] : "") + (user?.lastName ? user.lastName[0] : "");
    return (
      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-violet-600 text-white text-sm font-medium">
        {initials || "U"}
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[500] w-full bg-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-24">
          {!mobileOpen && (
            <nav aria-label="Logo menu" className="relative z-[60] flex">
              <Link
                to="/"
                aria-label="Logo"
                onClick={() => {
                  setMobileOpen(false);
                }}
              >
                <img
                  src={studyNotionLogo}
                  alt="logo"
                  className="h-9 w-auto"
                  style={{ height: 36 }}
                  loading="lazy"
                />
              </Link>
              <h1 className="sr-only">Site</h1>
            </nav>
          )}


          <button
            onClick={() => setMobileOpen((s) => !s)}
            aria-expanded={mobileOpen}
            aria-label="Open main menu"
            className="ml-auto xl:hidden relative z-[60] rounded-full flex-none flex items-center justify-center w-10 h-10 transition-colors
                       rounded-full bg-white/75 bg-gradient-to-r from-pink-200/40 via-violet-200/40 to-indigo-200/40
                       border border-white/50 px-2 text-sm shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 20 20"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              data-rtl-flip=""
              className={`icon transition-transform duration-200 ${mobileOpen ? "rotate-45" : ""}`}
              aria-hidden="true"
              role="img"
            >
              <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
            </svg>
          </button>

          <div className="pointer-events-auto hidden lg:flex xl:w-full items-center justify-end relative">
            <div className="hidden xl:flex items-center absolute left-1/2 -translate-x-1/2 rounded-full bg-white/75 bg-gradient-to-r from-pink-200/40 via-violet-200/40 to-indigo-200/40 border border-white/50 px-3 text-sm font-medium text-gray-800 shadow-lg shadow-gray-800/5 ring-1 ring-gray-800/[.075] backdrop-blur-xl">
              {NavbarLinks.map((link, idx) => {
                const isCatalog = link.title === "Catalog";
                const active = isRouteActive(link);
                return (
                  <div
                    key={idx}
                    className={`flex-none group relative px-3 cursor-default text-center`}
                    onMouseEnter={() => {
                      if (isCatalog) openCenterDropdown(link.title);
                    }}
                    onMouseLeave={() => {
                      if (isCatalog) closeCenterDropdownSoon(link.title);
                    }}
                  >
                    {isCatalog ? (
                      <button
                        type="button"
                        aria-expanded={centerDropdownOpen === link.title}
                        onClick={() => setCenterDropdownOpen((s) => (s === link.title ? null : link.title))}
                        className={`relative block transition duration-300 px-3 py-2.5 ${active ? "text-violet-600" : "text-gray-800 hover:text-violet-600"}`}
                      >
                        <span className="leading-none">{link.title}</span>
                      </button>
                    ) : (
                      <Link
                        to={link.path}
                        className={`relative block transition duration-300 px-3 py-2.5 ${active ? "text-violet-600" : "hover:text-violet-600"}`}
                      >
                        {link.title}
                      </Link>
                    )}

                    <span className="absolute inset-x-1 h-px bg-gradient-to-r from-violet-500/0 via-violet-400 to-violet-500/0 transition duration-300 -bottom-0.5 opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100" />

                    {isCatalog && (
                      <div
                        className={`bubble-b tail absolute left-1/2 -translate-x-1/2 mt-2 z-50 w-48 rounded-2xl bg-white p-2 text-navy shadow-lg transition-all duration-200 transform origin-top ${centerDropdownOpen === link.title ? "opacity-100 scale-100 translate-y-0 visible pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"}`}
                        onMouseEnter={() => openCenterDropdown(link.title)}
                        onMouseLeave={() => closeCenterDropdownSoon(link.title)}
                      >
                        <div className="rounded-tl w-3 h-3 absolute top-0 left-1/2 -ml-1.5 -mt-1.5 rotate-45 bg-white" />
                        {loading ? (
                          <div className="py-3 text-center text-sm">Loading…</div>
                        ) : subLinks?.length ? (
                          subLinks.map((s, i) => (
                            <Link
                              key={i}
                              to={`/catalog/${s.name.split(" ").join("-").toLowerCase()}`}
                              className="relative block whitespace-nowrap px-3 py-2.5 text-sm rounded-lg hover:bg-violet-50/40 hover:text-violet-600 transition-colors"
                              onClick={() => setCenterDropdownOpen(null)}
                            >
                              {s.name}
                            </Link>
                          ))
                        ) : (
                          <div className="py-2 text-sm">No courses found</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>


            {/* --- logged-in / profile container (replace this block) --- */}
            <div className="ml-1 flex-none flex items-center rounded-full bg-white/75 bg-gradient-to-r from-pink-200/40 via-violet-200/40 to-indigo-200/40 border border-white/50 text-sm font-medium text-gray-800 shadow-lg shadow-gray-800/5 ring-1 ring-gray-800/[.075] backdrop-blur-xl px-0">
              {!token || token == null ? (
                <>
                  <Link to="/login" className="ml-1 mt-1 mb-1 flex-none group relative inline-flex items-center bg-clip-padding rounded-l-[20px] rounded-r-[8px] border h-8 pl-3 pr-3 bg-white/40 border-white/90 shadow hover:text-violet-600 hover:bg-violet-50/40 transition-colors duration-300">
                    <span className="text-sm leading-none">Sign In</span>
                    <span className="absolute left-4 right-1 -bottom-0.5 h-px bg-gradient-to-r from-violet-500/0 via-violet-400 to-violet-500/0 transition duration-300 opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100" />
                  </Link>
                  <Link to="/signup" className="mr-1 mt-1 mb-1 btn-purple flex-none group relative inline-flex items-center ml-1 h-8 pr-3 pl-3 rounded-r-[20px] rounded-l-[8px] bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors">
                    Get Started
                  </Link>
                </>
              ) : (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileMenuOpen((s) => !s)}
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-violet-50 transition-colors duration-200 focus:outline-none"
                  >
                    {renderAvatar()}
                    <span className="hidden xl:inline text-sm font-medium text-gray-800">{user?.firstName || "Account"}</span>
                  </button>

                  <div
                    className={`absolute right-0 mt-2 z-50 w-48 rounded-2xl bg-white p-2 text-navy shadow-lg transition-all duration-200 transform origin-top ${profileMenuOpen
                      ? "opacity-100 scale-100 translate-y-0 visible pointer-events-auto"
                      : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"
                      }`}
                  >
                    <div className="rounded-tl w-3 h-3 absolute top-0 right-4 -mt-1.5 rotate-45 bg-white" />

                    <div className="py-1">
                      <Link to="/dashboard" className="relative block whitespace-nowrap px-3 py-2.5 text-sm rounded-lg hover:bg-violet-50/40 hover:text-violet-600 transition-colors">
                        Dashboard
                      </Link>
                      <Link to="/dashboard/my-profile" className="relative block whitespace-nowrap px-3 py-2.5 text-sm rounded-lg hover:bg-violet-50/40 hover:text-violet-600 transition-colors">
                        Profile
                      </Link>
                      <Link to="/dashboard/settings" className="relative block whitespace-nowrap px-3 py-2.5 text-sm rounded-lg hover:bg-violet-50/40 hover:text-violet-600 transition-colors">
                        Settings
                      </Link>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/login"
                        className="relative block whitespace-nowrap px-3 py-2.5 text-sm rounded-lg text-red-600 hover:bg-violet-50/40 transition-colors"
                        onClick={() => {
                          dispatch(logout(navigate));
                        }}
                      >
                        Sign Out
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* --- end replace --- */}

          </div>
        </div>
      </div>

      <div
        className={`xl:hidden fixed inset-0 z-40 transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} bg-gray-500/25 backdrop-blur-sm`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />

      <nav
        aria-label="Main menu"
        className={`xl:hidden transition-transform duration-300 ease-in-out text-sm fixed left-0 top-0 bottom-0 z-50 bg-white shadow-[1px_0_rgba(86,75,128,0.1)] overflow-hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"} w-[320px] sm:w-80`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="w-[36px]" aria-hidden="true" />

          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm text-violet-600 hover:bg-violet-50 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 pt-6 pb-32 overflow-y-auto max-h-full scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-200">
          {NavbarLinks.map((link, i) => {
            const isCatalog = link.title === "Catalog";
            const active = isRouteActive(link);
            return (
              <div key={i} className="mb-1 last:mb-0">
                {isCatalog ? (
                  <div>
                    <div className="flex items-center justify-between py-3">
                      <span className={`text-[15px] leading-7 ${active ? "text-violet-600" : "text-gray-900"}`}>{link.title}</span>
                      <button
                        className="text-lg leading-none px-2 py-1 text-gray-500"
                        onClick={() => setCenterDropdownOpen((s) => (s === link.title ? null : link.title))}
                        aria-expanded={centerDropdownOpen === link.title}
                      >
                        {centerDropdownOpen === link.title ? "−" : "+"}
                      </button>
                    </div>

                    {centerDropdownOpen === link.title && (
                      <div className="pl-4">
                        {loading ? (
                          <div className="py-2 text-sm text-gray-600">Loading...</div>
                        ) : subLinks?.length ? (
                          subLinks.map((s, idx) => (
                            <Link
                              key={idx}
                              to={`/catalog/${s.name.split(" ").join("-").toLowerCase()}`}
                              className="block text-[15px] leading-7 py-2 hover:text-violet-600 text-gray-800"
                              onClick={() => {
                                setMobileOpen(false);
                                setCenterDropdownOpen(null);
                              }}
                            >
                              {s.name}
                            </Link>
                          ))
                        ) : (
                          <div className="py-2 text-sm text-gray-600">No courses</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={link.path}
                    className={`block text-[15px] leading-7 py-3 transition-colors ${active ? "text-violet-600" : "text-gray-900 hover:text-violet-600"}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.title}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className={mobileOpen ? "fixed bottom-0 left-0 right-0 z-50 px-6 py-4 bg-white border-t border-gray-100" : "hidden"}>
          <div className="flex flex-col gap-3 items-center">
            {!token || token == null ? (
              <>
                <Link
                  to="/login"
                  className="inline-block w-[160px] text-center py-2 rounded-full border border-violet-200 text-violet-600 hover:bg-violet-50 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-block w-[160px] text-center py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </>
            ) : (
              <div className="w-full">
                <div className="flex items-center gap-3 px-2">
                  <div>{renderAvatar()}</div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName || user?.firstName || "Account"}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  <Link to="/dashboard" className="block w-full text-center py-2 rounded-full border border-violet-200 text-violet-600 hover:bg-violet-50 transition" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/dashboard/my-profile" className="block w-full text-center py-2 rounded-full bg-white border hover:bg-violet-50 transition" onClick={() => setMobileOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/dashboard/settings" className="block w-full text-center py-2 rounded-full bg-white border hover:bg-violet-50 transition" onClick={() => setMobileOpen(false)}>
                    Settings
                  </Link>
                  <Link to="/login" className="block w-full text-center py-2 rounded-full border text-red-600 hover:bg-violet-50 transition" onClick={() => {
                    dispatch(logout(navigate));
                    setMobileOpen(false);
                  }
                  }>
                    Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;