import React from "react";
import { Link } from "react-router-dom";

export function CTA({ children, to = "/app/sign-up", variant = "primary", className = "" }) {
    const base = "inline-flex items-center gap-3 rounded-full px-6 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition";
    const primary = "bg-gradient-to-r btn-purple bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors shadow-md hover:opacity-95 focus:ring-[#996bec]";
    const light = "bg-white/6 text-white/95 border border-white/10 hover:bg-white/5 focus:ring-white/40";

    return (
        <Link
            to={to}
            className={`${base} ${variant === "primary" ? primary : light} ${className} group`}
            aria-label={typeof children === "string" ? children : "Call to action"}
        >
            <span className="text-sm md:text-base">{children}</span>
            {/* <span className="ml-3 flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                <svg
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    className="transform transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                >
                    <path d="M4 8h8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span> */}
            <span className="ml-3 inline-flex items-center opacity-50 group-hover/btn:opacity-100 transition-opacity">
                <svg
                    role="img"
                    viewBox="0 0 16 16"
                    width="0"
                    height="10"
                    fill="currentColor"
                    className="w-0 group-hover/btn:w-6 h-3 translate-x-2.5 ease-out duration-200 transition-all transform-gpu overflow-visible"
                    aria-hidden
                >
                    <path d="M1 9h14a1 1 0 000-2H1a1 1 0 000 2z" />
                </svg>

                <svg
                    role="img"
                    viewBox="0 0 16 16"
                    width="10"
                    height="10"
                    fill="currentColor"
                    className="ml-1 size-[0.7em] h-4 w-4"
                    aria-hidden
                >
                    <path d="M7.293 1.707L13.586 8l-6.293 6.293a1 1 0 001.414 1.414l7-7a1 1 0 000-1.414l-7-7a1 1 0 00-1.414 1.414z" />
                </svg>
            </span>
        </Link>
    );
}