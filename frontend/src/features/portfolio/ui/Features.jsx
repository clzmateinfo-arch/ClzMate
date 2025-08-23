import React from "react";

export function IconBox({ children, colorClass = "emerald" }) {
    const gradients = {
        emerald: "from-green-300/50 to-emerald-300/50 text-emerald-500 ring-emerald-500/30 shadow-emerald-500/30",
        blue: "from-sky-300/50 to-blue-300/50 text-blue-500 ring-blue-500/30 shadow-blue-500/30",
        orange: "from-orange-200/50 to-orange-500/40 text-orange-500 ring-orange-500/35 shadow-orange-500/30",
        amber: "from-yellow-200/75 to-orange-200/75 text-amber-500 ring-amber-400/60 shadow-amber-500/30",
    };
    const cls = gradients[colorClass] || gradients.emerald;

    return (
        <div className={`flex justify-center items-center shrink-0 rounded-xl w-12 h-12 ring-1 shadow-xl bg-gradient-to-br ${cls}`} aria-hidden>
            {children}
        </div>
    );
}

export function FeatureItem({ title, children, color = "emerald" }) {
    return (
        <li className="group w-full relative grid grid-cols-[auto_1fr] items-start gap-6 text-left">
            <IconBox colorClass={color}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                </svg>
            </IconBox>
            <div>
                <h3 className="font-semibold text-lg text-[#0b1220]">{title}</h3>
                <p className="mt-3 text-base text-[#374151]">{children}</p>
            </div>
        </li>
    );
}

export function Features() {
    const globeImg = "/images/fly-globe.png";
    return (
        <>
            <div className="rotate-3 absolute -inset-x-12 -top-6 h-12 bg-gradient-to-r from-sky-300 via-indigo-300 to-pink-300 blur-3xl opacity-60 pointer-events-none" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-50 via-indigo-50 to-pink-50 opacity-30 pointer-events-none" aria-hidden="true" />

            <div className="relative container mx-auto py-16 xl:py-24 px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 gap-x-8 xl:gap-x-16 items-start">
                    <div className="relative max-w-xl space-y-4 lg:pb-20">
                        <h2 className="font-semibold text-2xl md:text-3xl lg:text-4xl text-[#0b1220]">Public Cloud Infrastructure. Modern Platform Endorphins.</h2>
                        <p className="text-lg text-[#374151]">The most flexible and powerful compute platform on any public cloud. Fly Machines are hardware-virtualized containers, running on our own hardware, that launch instantly and run exactly as long as you want them to — for a single HTTP request, or for weeks of uptime.</p>

                        <div className="hidden lg:block w-full h-px absolute bottom-0 bg-gradient-to-r from-[#334155] via-[#334155]/40 to-transparent" aria-hidden />
                    </div>

                    <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
                        <img src={globeImg} alt="Globe visualization" width="400" className="w-full max-w-sm -mb-12 relative lg:-mt-4 object-contain" loading="lazy" />
                    </div>
                </div>

                <ul className="grid lg:grid-cols-2 gap-y-12 gap-x-8 xl:gap-x-16 mt-12">
                    <FeatureItem title="Get Right in Your Users' Faces" color="emerald">Deploy in 35 regions, from Sydney to São Paulo, for sub-100ms response times and native-app feel no matter where your users are.</FeatureItem>
                    <FeatureItem title="Fork Off VMs Like They're Processes" color="blue">Fly Machines start fast enough to handle HTTP requests, run only when you need them, and scale into tens of thousands of instances.</FeatureItem>
                    <FeatureItem title="Ship GPU-Boosted Models" color="orange">From LLMs to inferencing, hardware acceleration with the same developer experience as a simple CRUD app.</FeatureItem>
                    <FeatureItem title="Built for Distributed Systems" color="amber">Clustered databases like Cockroach, globally-distributed Postgres, and modern RPC systems — no Terraform required.</FeatureItem>
                </ul>
            </div>
        </>
    );
}