/* eslint-disable react/prop-types */
import React from "react";

export default function SocialAuthButton({
    href,
    onClick,
    logo,
    label,
    theme = "primary",
    className = "",
    ariaLabel,
    fullWidth = true,
    rel = "noopener noreferrer",
    target = "_self",
}) {
    const base = "rounded-xl inline-flex items-center gap-3 px-4 py-3 font-medium transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-2";

    const themes = {
        primary:
            "bg-white/95 text-[#0b1220] border border-[#E9EFF5] hover:shadow-md",
        facebook:
            "bg-white text-[#0b1220] border border-[#E9EFF5] hover:shadow-sm",
        google:
            "bg-white text-[#0b1220] border border-[#E9EFF5] hover:shadow-sm",
        subtle:
            "bg-[#0f1724] text-[#e6eef8] border border-[#111827] hover:shadow-md",
    };

    const t = (typeof theme === "string" ? themes[theme] || theme : theme) || themes.primary;

    const Wrapper = ({ children }) =>
        href ? (
            <a
                href={href}
                onClick={onClick}
                className={`${base} ${t} ${fullWidth ? "w-full" : ""} ${className}`}
                aria-label={ariaLabel || label}
                target={target}
                rel={rel}
            >
                {children}
            </a>
        ) : (
            <button
                type="button"
                onClick={onClick}
                className={`${base} ${t} ${fullWidth ? "w-full" : ""} ${className}`}
                aria-label={ariaLabel || label}
            >
                {children}
            </button>
        );

    const LogoNode =
        typeof logo === "string" ? (
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shrink-0">
                <img src={logo} alt="" className="w-5 h-5 object-contain" width="20" height="20" />
            </div>
        ) : (
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shrink-0">{logo}</div>
        );

    return (
        <Wrapper>
            <span className="sr-only">{label}</span>
            <div className="flex items-center gap-3">
                {LogoNode}
                <span className="text-sm font-medium">{label}</span>
            </div>
        </Wrapper>
    );
}
