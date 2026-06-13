 
import React, { useMemo } from "react";
import { Link, matchPath } from "react-router-dom";
import Dropdown from "./Dropdown";

const NavItem = React.memo(({ link, pathname, openDropdown, closeDropdown, centerDropdownOpen }) => {
    const hasMenu = Boolean(link?.subLinks || link?.getSubLinks);

    const active = useMemo(() => {
        if (!link) return false;
        if (link.path === "/") return pathname === "/";
        if (link.path) {
            const match = matchPath({ path: link.path, end: true }, pathname);
            return Boolean(match);
        }
        return false;
    }, [link, pathname]);

    const isOpen = centerDropdownOpen === link.title;

    return (
        <div className="flex-none group relative px-3 cursor-default text-center">
            {hasMenu ? (
                <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => (isOpen ? closeDropdown(link.title) : openDropdown(link.title))}
                    className={`relative block transition duration-300 px-3 py-2.5 ${active ? "text-violet-600" : "text-gray-800 hover:text-violet-600"
                        }`}
                >
                    <span className="leading-none">{link.title}</span>
                </button>
            ) : (
                <Link
                    to={link.path}
                    className={`relative block transition duration-300 px-3 py-2.5 ${active ? "text-violet-600" : "hover:text-violet-600"
                        }`}
                >
                    {link.title}
                </Link>
            )}

            <span className="absolute inset-x-1 h-px bg-gradient-to-r from-violet-500/0 via-violet-400 to-violet-500/0 transition duration-300 -bottom-0.5 opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100" />

            {hasMenu && (
                <Dropdown
                    anchorTitle={link.title}
                    path={link.path}
                    source={link.subLinks || link.getSubLinks}
                    open={isOpen}
                    closeDropdown={closeDropdown}
                />
            )}
        </div>
    );
});

NavItem.displayName = "NavItem";

export default NavItem;
