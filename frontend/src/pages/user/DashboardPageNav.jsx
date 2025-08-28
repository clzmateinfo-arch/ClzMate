/* eslint-disable react/prop-types */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaCog, FaTrashAlt } from "react-icons/fa";

const navItems = [
    { id: "settings", label: "Settings", to: "/dashboard/settings", Icon: FaCog },
    { id: "delete", label: "Delete account", to: "/dashboard/deactivate", Icon: FaTrashAlt },
];

export default function DashboardPageNav() {
    const location = useLocation();
    const pathname = location?.pathname ?? "/";

    return (
        <>
            <div
                aria-hidden={false}
                className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[min(94%,720px)] max-w-lg"
            >
                <div
                    role="navigation"
                    aria-label="Dashboard actions"
                    className="mx-auto rounded-xl p-3 font-medium bg-white/6 backdrop-blur-sm text-black shadow-lg shadow-black/10 ring-1 ring-white/10 flex items-center gap-3 justify-center"
                >
                    {navItems.map((item) => {
                        const active = pathname === item.to;
                        return (
                            <Link
                                key={item.id}
                                to={item.to}
                                className={`inline-flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${active ? "bg-gradient-to-tr from-[#ba7bf0] to-[#996bec] text-white shadow-md" : "hover:bg-white/10"
                                    }`}
                                aria-current={active ? "page" : undefined}
                            >
                                <span
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${active ? "bg-white/10" : "bg-white/0"
                                        }`}
                                >
                                    <item.Icon className={`w-4 h-4 ${active ? "text-white" : "text-[#6b6b7a]"}`} />
                                </span>
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <nav
                aria-label="Dashboard actions"
                className="hidden lg:flex lg:flex-col lg:sticky lg:top-[5.5rem] lg:left-6 z-40 lg:space-y-3"
                style={{ alignSelf: "start" }}
            >
                <div className="rounded-2xl bg-white/6 backdrop-blur-sm ring-1 ring-white/8 shadow-sm p-3 flex flex-col gap-3">
                    {navItems.map((item) => {
                        const active = pathname === item.to;
                        return (
                            <Link
                                key={item.id}
                                to={item.to}
                                className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors
                                    ${active ? "bg-gradient-to-tr from-[#ba7bf0] to-[#996bec] text-white shadow-md" : "hover:bg-white/10"}`}
                                aria-current={active ? "page" : undefined}
                            >
                                <span
                                    className={`flex items-center justify-center w-9 h-9 rounded-md ${active ? "bg-white/10" : "bg-white/0"
                                        }`}
                                >
                                    <item.Icon className={`w-4 h-4 ${active ? "text-white" : "text-[#6b6b7a]"}`} />
                                </span>

                                <span className="text-sm font-medium text-black/80 group-hover:text-black/95">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
