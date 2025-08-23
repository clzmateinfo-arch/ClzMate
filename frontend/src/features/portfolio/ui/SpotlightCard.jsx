import React from "react";
import { CTA } from "@/shared/components/ui/LinkButton";

export function SpotlightCard({ img, title, text, ctaText = "Learn More", ctaHref = "#" }) {
    return (

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-7 items-center gap-x-8 gap-y-4 px-6 md:px-12 py-6 rounded-3xl bg-gradient-to-br from-[#2b0b3a]/70 via-[#0b1220]/50 to-[#000000]/10 ring-1 ring-violet-400/10 border border-black/10">
                <div className="lg:order-last lg:col-span-3 lg:-mr-9 -mb-6 lg:mb-0">
                    <img src={img} alt="Spotlight" width="400" className="w-full max-w-lg mx-auto object-contain" loading="lazy" />
                </div>

                <div className="space-y-4 py-6 md:py-10 lg:py-12 xl:py-20 lg:col-span-4">
                    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white bg-gradient-to-br from-orange-400 to-orange-600 ring-1 ring-orange-400">NEW!</span>
                    <h2 className="text-2xl md:text-3xl font-semibold text-white -mt-1">{title}</h2>
                    <p className="text-lg text-white/80 pb-3">{text}</p>
                    <div className="flex gap-4">
                        <CTA to={ctaHref} variant="primary">{ctaText}</CTA>
                    </div>
                </div>
            </div>
        </div>
    );
}