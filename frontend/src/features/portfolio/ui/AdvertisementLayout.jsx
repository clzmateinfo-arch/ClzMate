import React from "react";
import { LinkedButton } from "@/shared/components/ui/LinkButton";
import adImg from "@/shared/assets/images/porfolio/advertisment.png";

export function AdvertisementLayout() {
    return (
        <section className="relative bg-white py-24 xl:py-32 overflow-visible">
            <div
                className="rotate-3 absolute -inset-x-12 -top-6 h-12 bg-gradient-to-r from-sky-300 via-indigo-300 to-pink-300 blur-3xl opacity-60 pointer-events-none"
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 bg-gradient-to-tr from-sky-300/10 via-indigo-300/10 to-pink-300/10 pointer-events-none"
                aria-hidden="true"
                style={{
                    WebkitMaskImage:
                        "linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0))",
                    maskImage:
                        "linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0))",
                }}
            />

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 gap-x-8 xl:gap-x-16 items-center">
                    <img
                        src={adImg}
                        alt="Managed Postgres"
                        width="400"
                        className="w-full max-w-sm mx-auto mb-6 lg:mb-0 object-contain"
                        loading="lazy"
                    />
                    <div className="space-y-4">
                        <span className="inline-flex mb-1 rounded-full px-2.5 py-0.5 text-xs tracking-wide font-extrabold text-emerald-600 bg-gradient-to-br from-green-300/50 to-emerald-300/50 ring-1 ring-emerald-500/35">
                            NEW!
                        </span>

                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#0b1220]">
                            Fly.io Managed Postgres
                        </h2>

                        <p className="text-lg text-[#374151] max-w-2xl">
                            A fully-managed database service that handles all aspects of running
                            production PostgreSQL. We take care of backups, high availability,
                            monitoring, and scaling so you can focus on your app.
                        </p>

                        <ul className="space-y-3 mt-4 text-base text-[#374151]">
                            {[
                                "Automatic backups and recovery",
                                "High availability with automatic failover",
                                "Performance monitoring and metrics",
                                "Resource scaling (CPU, RAM, storage)",
                                "Automatic encryption of data at rest and in transit",
                            ].map((label, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 20 20"
                                        className="w-4 h-4 flex-shrink-0 mt-[3px] text-emerald-500"
                                        fill="currentColor"
                                    >
                                        <path d="M7.5 13.5L4 10l1.1-1.1L7.5 11.3 14.9 3.9 16 5z" />
                                    </svg>
                                    <span className="leading-snug">{label}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6">
                            <LinkedButton
                                to="/docs/mpg"
                                className="btn-xl btn-purple group/btn btn-border-dark rounded-full"
                            >
                                Learn More
                            </LinkedButton>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AdvertisementLayout;
