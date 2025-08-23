import React, { useEffect, useState } from "react";
import { HiArrowNarrowUp } from "react-icons/hi";

export default function BackToTop() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const onScroll = () => setShow(window.scrollY > 500);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const prefersReducedMotion =
        typeof window !== "undefined" && window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false;

    const handleClick = () => {
        if (typeof window === "undefined") return;
        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? "auto" : "smooth",
        });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label="Back to top"
            title="Back to top"
            className={[
                "fixed right-4 z-[999] flex items-center justify-center",
                "w-10 h-10 lg:w-11 lg:h-11 rounded-lg",
                "bg-gradient-to-br from-violet-700 via-purple-500 to-fuchsia-900 text-white",
                "shadow-md ring-1 ring-black/20",
                "group",
                "transform transition-all duration-200 ease-out",
                show
                    ? "translate-y-0 opacity-100 pointer-events-auto bottom-6"
                    : "translate-y-6 opacity-0 pointer-events-none -bottom-24",
                "hover:scale-105 hover:-translate-y-1 hover:shadow-xl",
                "focus:outline-none focus:ring-2 focus:ring-violet-900 focus:ring-offset-2",
            ].join(" ")}
            style={prefersReducedMotion ? { transitionDuration: "0ms" } : undefined}
        >
            <span className="sr-only">Back to top</span>

            <HiArrowNarrowUp
                className="w-4 h-4 transform transition-transform duration-200 ease-out group-hover:-translate-y-1"
                aria-hidden="true"
            />
        </button>
    );
}
