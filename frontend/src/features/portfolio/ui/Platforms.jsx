import React from "react";
import { CTA } from "@/shared/components/ui/LinkButton";

export function PlatformsGrid({ platforms = [] }) {
    return (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-5">
            {platforms.map((p) => (
                <li key={p.name}>
                    <a href="#" className="h-full grid place-items-center px-4 py-8 rounded-2xl bg-white/6 hover:scale-105 transform transition" aria-label={p.name}>
                        <img src={p.src} alt={p.name} className="max-w-full h-8 object-contain" loading="lazy" width="150" height="28" />
                    </a>
                </li>
            ))}
        </ul>
    );
}

export function Platforms({ platforms = [] }) {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:grid gap-8 lg:gap-12 xl:gap-20 items-center grid-cols-2">
                <div className="relative max-w-xl space-y-6">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold">Use the Tech You Love</h2>
                    <p className="text-lg text-white/80">Build with your favorite framework. No Dockerfile? No problem: our CLI generates containers for most popular frameworks.</p>
                    <div className="flex gap-3 mt-4">
                        <CTA to="/docs/speedrun" variant="light">Learn More</CTA>
                    </div>
                </div>

                <div className="w-full">
                    <PlatformsGrid platforms={platforms} />
                </div>
            </div>
        </div>
    );
}