import React from "react";

export function LogosQueue({ logos = [], speedSeconds = 40 }) {
    const animation = `marquee_${speedSeconds}s`;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="sr-only">Trusted by teams</h3>
            <div className="relative overflow-hidden select-none py-6">
                <div className={`flex gap-8 will-change-transform animate-[${animation}_linear_infinite]`} style={{ minWidth: "200%" }}>
                    {[...logos, ...logos].map((src, i) => (
                        <a key={i} href="#" className="flex-none p-4 lg:px-6 rounded-full hover:scale-105 transition-transform" aria-hidden={i >= logos.length}>
                            <img src={src} alt="" className="h-6 md:h-8 object-contain" width="120" height="28" loading="lazy" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}