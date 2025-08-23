import React from "react";
import { Link } from "react-router-dom";

export function LinkedButton({ children, to = "/app/sign-up", variant = "primary", className = "" }) {
  const base = "inline-flex items-center gap-3 rounded-full px-6 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition";
  const primary = "bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white shadow-md hover:opacity-95 focus:ring-[#996bec]";
  const light = "bg-white/6 text-white/95 border border-white/10 hover:bg-white/5 focus:ring-white/40";

  return (
    <Link
      to={to}
      className={`${base} ${variant === "primary" ? primary : light} ${className} group`}
      aria-label={typeof children === "string" ? children : "Call to action"}
    >
      <span className="text-sm md:text-base">{children}</span>
      <span className="ml-3 flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
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
      </span>
    </Link>
  );
}