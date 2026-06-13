import React from "react";
import NavItem from "./NavItem";

const DesktopCenterNav = React.memo(({ links = [], pathname, openDropdown, closeDropdown, centerDropdownOpen }) => {
    return (
        <div className="hidden xl:flex items-center absolute left-1/2 -translate-x-1/2 rounded-full bg-white/75 bg-gradient-to-r from-pink-200/40 via-violet-200/40 to-indigo-200/40 border border-white/50 px-3 text-sm font-medium text-gray-800 shadow-lg shadow-gray-800/5 ring-1 ring-gray-800/[.075] backdrop-blur-xl">
            {links.map((link, idx) => (
                <NavItem
                    key={idx}
                    link={link}
                    pathname={pathname}
                    openDropdown={openDropdown}
                    closeDropdown={closeDropdown}
                    centerDropdownOpen={centerDropdownOpen}
                />
            ))}
        </div>
    );
});
DesktopCenterNav.displayName = "DesktopCenterNav";

export default DesktopCenterNav;
