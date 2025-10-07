import React from "react";
import globeImg from "@/shared/assets/images/porfolio/fly-globe.png";

export function IconBox({ children, colorClass = "emerald", className = "" }) {
    const gradients = {
        emerald:
            "from-green-300/50 to-emerald-300/50 text-emerald-500 ring-emerald-500/35 shadow-emerald-500/30",
        blue: "from-sky-300/50 to-blue-300/50 text-blue-500 ring-blue-500/30 shadow-blue-500/30",
        orange:
            "from-orange-200/50 to-orange-500/40 text-orange-500 ring-orange-500/35 shadow-orange-500/30",
        amber:
            "from-yellow-200/75 to-orange-200/75 text-amber-500 ring-amber-400/60 shadow-amber-500/30",
    };
    const cls = gradients[colorClass] || gradients.emerald;

    return (
        <div
            className={`flex justify-center items-center shrink-0 rounded-xl w-12 h-12 ring-1 shadow-xl bg-gradient-to-br ${cls} ${className}`}
            aria-hidden="true"
        >
            {children}
        </div>
    );
}

export function FeatureItem({ title, children, color = "emerald", icon }) {
    return (
        <li className="group w-full relative grid grid-cols-[auto_1fr] items-start gap-8 text-left">
            <IconBox colorClass={color}>
                {icon ?? (
                    <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden>
                        <circle cx="10" cy="10" r="8" />
                    </svg>
                )}
            </IconBox>

            <div>
                <h3 className="font-heading text-lg md:text-[1.125rem] text-[#0b1220]">{title}</h3>
                <p className="mt-4 text-base text-[#374151]">{children}</p>
            </div>
        </li>
    );
}

export default function Features() {
    const globeSVG = (
        <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden>
            <path
                d="M10 2.2a7.8 7.8 0 100 15.6 7.8 7.8 0 000-15.6zm3.5 12.3a6.2 6.2 0 01-2.9 1.2c.3-.9.5-2.2.5-3.8 0-1.6-.2-2.9-.5-3.8a6.2 6.2 0 012.9 1.2c.4.4.8 1.2.8 2.6s-.4 2.2-.8 2.6z"
                fillOpacity="0.95"
            />
        </svg>
    );

    const nodesSVG = (
        <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden>
            <path d="M3 4.5A1.5 1.5 0 114.5 6 1.5 1.5 0 013 4.5zm14 0A1.5 1.5 0 1118.5 6 1.5 1.5 0 0117 4.5zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fillOpacity="0.9" />
            <path d="M4.5 6A6 6 0 0110 10.5 6 6 0 0115.5 6" fillOpacity="0.3" />
        </svg>
    );

    const gpuSVG = (
        <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden>
            <rect x="2.5" y="5" width="15" height="10" rx="1" />
            <path d="M5 2.5v2M15 2.5v2" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const distributedSVG = (
        <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden>
            <path d="M10 2a2 2 0 012 2v3l2 2v3a2 2 0 01-2 2H8a2 2 0 01-2-2v-3l2-2V4a2 2 0 012-2z" fillOpacity="0.95" />
        </svg>
    );

    return (
        <section className="relative bg-white overflow-hidden">
            <div
                className="rotate-3 absolute -inset-x-12 -top-6 h-12 bg-gradient-to-r from-sky-300 via-indigo-300 to-pink-300 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 bg-[linear-gradient(100deg,rgba(56,189,248,0.08),rgba(99,102,241,0.06),rgba(236,72,153,0.06))] [-webkit-mask-image:linear-gradient(to_bottom,rgba(255,255,255,1)_75%,rgba(255,255,255,0))]"
                aria-hidden="true"
            />

            <div className="relative container mx-auto py-24 xl:py-32 px-4 sm:px-6 lg:px-8 grid gap-20 items-center">
                <div className="lg:grid grid-cols-2 gap-x-8 xl:gap-x-16 items-start">
                    <div className="relative lg:max-w-xl space-y-4 lg:pb-20">
                        <h2 className="font-heading mb-3 text-2xl md:text-3xl lg:text-4xl text-[#0b1220]">
                            Why<strong className="text-[#0b1220]"> Up ?</strong>
                        </h2>

                        <p className="text-lg text-[#374151]">
                            Education is changing. <strong className="text-[#0b1220]"> 'Up'</strong> simplifies modern learning with an elegant platform that empowers instructors and delights students
                        </p>

                        <div
                            className="hidden lg:block w-full h-px absolute bottom-0 bg-gradient-to-r from-[#334155] via-[#334155]/40 to-transparent"
                            aria-hidden
                        >
                            <svg viewBox="0 0 6 3" width="6" height="3" className="-mt-px fill-[#334155]">
                                <path d="M2.594 2.525A1.501 1.501 0 112.635.519c.274.295.665.479 1.098.479H6v1.004H3.733a1.5 1.5 0 00-1.108.489l-.017.02-.013.015-.001-.001z" />
                            </svg>
                        </div>
                    </div>

                    <div className="mt-8 lg:-mt-12 flex justify-center">
                        <img
                            src={globeImg}
                            alt="Globe visualization"
                            width="400"
                            className="w-full max-w-sm -mb-12 relative lg:-mt-4 object-contain"
                            loading="lazy"
                        />
                    </div>
                </div>

                <ul className="grid lg:grid-cols-2 gap-y-16 gap-x-8 xl:gap-x-16">
                    <FeatureItem title="Built For Educators" color="emerald" icon={globeSVG}>
                        create courses, manage materials, and schedule sessions in minutes
                    </FeatureItem>

                    <FeatureItem title="Learner First Experience" color="blue" icon={nodesSVG}>
                        intuitive UI, progress tracking, and personalised recommendations
                    </FeatureItem>

                    <FeatureItem title="Scale With Confidence" color="orange" icon={gpuSVG}>
                        Enterprise features, security, and analytics for all users
                    </FeatureItem>

                    <FeatureItem title="Built For Distributed Systems" color="amber" icon={distributedSVG}>
                        Global classrooms need low latency and high availability
                    </FeatureItem>
                </ul>
            </div>
        </section>
    );
}
