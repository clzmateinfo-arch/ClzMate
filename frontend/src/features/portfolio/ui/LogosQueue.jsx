// LogosQueue.jsx
import React from "react";

/**
 * logos: array of either strings (src) or objects { src, alt, href }
 * speedSeconds: duration for one loop (default 40)
 * gap: gap between logos, any valid CSS length (default "2rem")
 */
export function LogosQueue({
    logos = [],
    speedSeconds = 40,
    gap = "2rem",
    className = "",
}) {
    // normalize logos into objects
    const items = logos.map((l) =>
        typeof l === "string" ? { src: l, alt: "" } : { href: "#", alt: "", ...l }
    );

    // duplicate for seamless scroll
    const loop = [...items, ...items];

    return (
        <div className={`container mx-auto relative pt-24 ${className}`}>
            <h2 className="font-bold text-violet-700 text-sm uppercase tracking-wider text-center mb-6">
                Trusted by teams at
            </h2>

            {/* 
        --scroll-speed controls animation duration
        --gap controls spacing used by mask and gap styles 
      */}
            <div
                className="logos-queue group relative flex overflow-hidden select-none"
                style={{
                    // custom properties used in the <style> block below
                    ["--scroll-speed"]: `${speedSeconds}s`,
                    ["--gap"]: gap,
                }}
            >
                {/* single long row that contains duplicated items and scrolls left */}
                <div
                    className="marquee flex items-center gap-[var(--gap)] will-change-transform"
                    // enforce minWidth so the duplicated content forms a double-width strip
                    style={{ minWidth: "200%" }}
                >
                    {loop.map((item, i) => {
                        const isDuplicate = i >= items.length;
                        const key = `${item.src}-${i}`;
                        const tabIndex = isDuplicate ? -1 : 0;
                        const ariaHidden = isDuplicate ? true : false;

                        const content = (
                            <div
                                className="flex-none p-4 lg:px-6 rounded-full transition-transform transform-gpu hover:scale-105"
                                aria-hidden={ariaHidden}
                                tabIndex={tabIndex}
                                key={key}
                            >
                                {/* if user provided href, wrap; otherwise plain image */}
                                {item.href ? (
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative block before:content-[''] before:absolute before:inset-0 before:z-[-1] before:scale-90 before:rounded-full hover:before:scale-100 before:transition-all hover:before:bg-violet-50"
                                        aria-label={item.alt || undefined}
                                    >
                                        <img
                                            src={item.src}
                                            alt={item.alt || ""}
                                            className="h-6 md:h-8 object-contain pointer-events-none"
                                            width="140"
                                            height="32"
                                            loading="lazy"
                                        />
                                    </a>
                                ) : (
                                    <img
                                        src={item.src}
                                        alt={item.alt || ""}
                                        className="h-6 md:h-8 object-contain pointer-events-none"
                                        width="140"
                                        height="32"
                                        loading="lazy"
                                    />
                                )}
                            </div>
                        );

                        return content;
                    })}
                </div>
            </div>

            {/* Component-local CSS (keyframes, mask, pause-on-hover etc). */}
            <style>{`
        /* marquee animation: move left by 50% (since content is duplicated and min-width:200%) */
        .logos-queue .marquee {
          animation: marquee var(--scroll-speed, 40s) linear infinite;
        }

        /* pause on hover or keyboard focus within (accessibility) */
        .logos-queue.group:hover .marquee,
        .logos-queue.group:focus-within .marquee {
          animation-play-state: paused;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* mask fade on both edges (use same var(--gap) used for spacing) */
        .logos-queue {
          /* use both mask-image and -webkit-mask-image for better browser coverage */
          mask-image: linear-gradient(
            to right,
            rgba(0,0,0,0) 0%,
            rgba(0,0,0,1) calc(var(--gap) * 2),
            rgba(0,0,0,1) calc(100% - var(--gap) * 2),
            rgba(0,0,0,0) 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            rgba(0,0,0,0) 0%,
            rgba(0,0,0,1) calc(var(--gap) * 2),
            rgba(0,0,0,1) calc(100% - var(--gap) * 2),
            rgba(0,0,0,0) 100%
          );
        }

        /* small performance tweak */
        .logos-queue .marquee > * {
          backface-visibility: hidden;
          transform: translateZ(0);
        }
      `}</style>
        </div>
    );
}
