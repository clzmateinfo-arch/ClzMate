import React from "react";
import { CTA } from "@/shared/components/ui/LinkButton";

export function Hero() {
    return (
        <>
            {/* <div className="absolute left-1/2 bottom-0 -translate-x-1/2 lg:translate-x-0 z-0 pointer-events-none" aria-hidden="true">
                <picture>
                    <source srcSet={heroAvif} type="image/avif" />
                    <img src={heroBg} alt="" width="1440" className="w-[1200px] lg:w-[1750px] 3xl:w-full max-w-[2000px] h-auto object-contain" loading="lazy" />
                </picture>
            </div> */}

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 z-10">
                <div className="relative flex flex-col items-start sm:items-center sm:text-center max-w-3xl mx-auto">
                    <h1 className="font-extrabold text-[34px] sm:text-[40px] md:text-[48px] lg:text-[64px] leading-[1.08] sm:leading-[1.12] tracking-[-0.025em] text-[#0b1220] mb-5 -mt-4">
                        A Public Cloud Built For <br className="hidden lg:block" /> Developers Who <em className="relative inline-block">Ship</em>
                    </h1>

                    <p className="text-base md:text-lg tracking-normal mb-9 max-w-[46.875rem] text-[#374151]">
                        <strong className="text-[#0b1220]">Over 3 million apps</strong> have launched on Fly.io, leveraging global Anycast load-balancing, zero-config private networking, hardware isolation, instant WireGuard VPN connections, and push-button deployments scaling to thousands of instances.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <CTA to="/app/sign-up">Deploy Your App in 5 minutes</CTA>
                    </div>
                </div>
            </div>
        </>
    );
}