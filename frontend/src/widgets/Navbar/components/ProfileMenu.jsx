/* eslint-disable react/prop-types */
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import useOnClickOutside from "../hooks/useOnClickOutside";
import { Avatar } from "@/shared/components/ui/Avatar";

const ProfileMenu = ({ user, onSignOut }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useOnClickOutside(ref, () => setOpen(false));

    return (
        <div ref={ref} className="relative">
            <button onClick={() => setOpen((s) => !s)} aria-expanded={open} aria-haspopup="true" className="flex items-center gap-2 px-1.5 py-1.5 rounded-full hover:bg-violet-50 transition-colors duration-200 focus:outline-none">
                <Avatar user={user} />
                <span className="hidden xl:inline text-sm font-medium text-gray-800">{user?.preferredName || "Account"}</span>
            </button>

            <div className={`absolute right-0 mt-2 z-50 w-48 rounded-2xl bg-white p-2 text-navy shadow-lg transition-all duration-200 transform origin-top ${open ? "opacity-100 scale-100 translate-y-0 visible pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"}`}>
                <div className="rounded-tl w-3 h-3 absolute top-0 right-4 -mt-1.5 rotate-45 bg-white" />
                <div className="py-1">
                    <Link to="/dashboard" className="relative block whitespace-nowrap px-3 py-2.5 text-sm rounded-lg hover:bg-violet-50/40 hover:text-violet-600 transition-colors">Dashboard</Link>
                    <Link to="/dashboard/my-profile" className="relative block whitespace-nowrap px-3 py-2.5 text-sm rounded-lg hover:bg-violet-50/40 hover:text-violet-600 transition-colors">Profile</Link>
                    <Link to="/dashboard/settings" className="relative block whitespace-nowrap px-3 py-2.5 text-sm rounded-lg hover:bg-violet-50/40 hover:text-violet-600 transition-colors">Settings</Link>
                </div>
                <div className="py-1">
                    <button className="relative block whitespace-nowrap px-3 py-2.5 text-sm rounded-lg text-red-600 hover:bg-violet-50/40 transition-colors" onClick={onSignOut}>Sign Out</button>
                </div>
            </div>
        </div>
    );
};

export default ProfileMenu;
