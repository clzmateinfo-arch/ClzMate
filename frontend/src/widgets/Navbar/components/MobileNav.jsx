/* eslint-disable react/prop-types */
import React from "react";
import { Link, matchPath } from "react-router-dom";
import { LinkedButton } from "@/shared/components/ui/LinkButton";
import MobileSubmenu from "./MobileSubmenu";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { LogoWithoutImage } from "@/shared/components/ui/Logo";

const slugify = (v = "") =>
    String(v).toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export default function MobileNav({
    links = [],
    open = false,
    onClose = () => { },
    pathname = "/",
    centerDropdownOpen = null,
    setCenterDropdownOpen = () => { },
    token = null,
    user = null,
    onSignOut = () => { },
}) {
    const overlayClasses = open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none";
    const panelTransform = open ? "translate-x-0" : "-translate-x-full";

    return (
        <>
            <div
                aria-hidden={!open}
                onClick={onClose}
                className={`xl:hidden fixed inset-0 z-40 transition-all duration-300 ${overlayClasses} bg-gray-500/25 backdrop-blur-sm`}
            />

            <nav
                aria-label="Main menu"
                className={`xl:hidden fixed left-0 top-0 bottom-0 z-50 max-w-2 bg-white shadow-[1px_0_rgba(86,75,128,0.1)] overflow-auto transition-transform duration-300 ${panelTransform}`}
                style={{ width: "50%", maxWidth: "20rem", minWidth: "15rem" }}
            >
                <div className="mt-12 ml-5 relative z-[60] flex-none flex items-center">
                    <LogoWithoutImage onClick={() => setMobileOpen(false)} className="" />
                </div>
                <div className="mt-3 pt-5 pb-10 px-5">
                    <div className="max-h-[60vh] overflow-y-auto ml-2 scrollbar-thin scrollbar-thumb-gray-200" id="mob-nav-items">
                        {links.map((link, idx) => {
                            const linkPath = link?.path ?? `/${slugify(link?.title ?? `item-${idx}`)}`;

                            const hasMenu = Boolean(link?.subLinks || link?.getSubLinks);

                            const active = (() => {
                                if (!link) return false;
                                if (linkPath === "/") return pathname === "/";
                                const match = matchPath({ path: linkPath, end: true }, pathname);
                                return Boolean(match);
                            })();

                            if (hasMenu) {
                                const expanded = centerDropdownOpen === link.title;
                                return (
                                    <div key={idx} className="last:mb-0">
                                        <div className="pb-3">
                                            <button
                                                type="button"
                                                onClick={() => setCenterDropdownOpen((s) => (s === link.title ? null : link.title))}
                                                aria-expanded={expanded}
                                                aria-controls={`mobile-submenu-${idx}`}
                                                className={`w-full flex items-center justify-between text-left py-1 px-0 focus:outline-none ${active ? "text-violet-600" : "text-gray-900 hover:text-violet-600"}`}
                                            >
                                                <span className="text-[15px] leading-7">{link.title}</span>

                                                <span className="ml-3 flex items-center justify-center text-gray-500">
                                                    {expanded ? <HiChevronUp className="w-4 h-4 text-violet-600" /> : <HiChevronDown className="w-4 h-4 text-violet-600" />}
                                                </span>
                                            </button>
                                        </div>

                                        <div id={`mobile-submenu-${idx}`} aria-hidden={!expanded}>
                                            {expanded && <MobileSubmenu path={linkPath} source={link.subLinks || link.getSubLinks} onClose={onClose} />}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={idx}
                                    to={linkPath}
                                    onClick={onClose}
                                    className={`mb-3 block text-[15px] leading-7 py-1 transition-colors ${active ? "text-violet-600" : "text-gray-900 hover:text-violet-600"}`}
                                >
                                    {link.title}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="absolute left-5 right-5 bottom-5 mb-1 mt-8 space-y-3 " id="action-buttons">
                        {!token ? (
                            <div className="mt-5 justify-start">
                                <LinkedButton
                                    to="/login"
                                    className="mt-2 block w-full text-left border border-gray-300 shadow-sm text-violet-600 hover:border-violet-500/40 hover:bg-violet-200 py-2 px-4"
                                    onClick={onClose}
                                >
                                    Sign In
                                </LinkedButton>

                                <LinkedButton
                                    to="/signup"
                                    className="mt-2 block w-full text-center bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded"
                                    onClick={onClose}
                                >
                                    Get Started
                                </LinkedButton>
                            </div>
                        ) : (
                            <div className="w-[90%] mt-5 justify-start">
                                <LinkedButton
                                    to="/dashboard"
                                    className="m-2 block w-full text-left border border-gray-300 shadow-sm text-violet-600 hover:border-violet-500/40 hover:bg-violet-200 py-2 px-4"
                                    onClick={onClose}
                                >
                                    Dashboard
                                </LinkedButton>
                                <LinkedButton
                                    to="/login"
                                    className="m-2 block w-full text-left border border-gray-300 shadow-sm text-violet-600 hover:border-violet-500/40 hover:bg-violet-200 py-2 px-4"
                                    onClick={() => {
                                        onSignOut();
                                        onClose();
                                    }}
                                >
                                    Sign Out
                                </LinkedButton>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
