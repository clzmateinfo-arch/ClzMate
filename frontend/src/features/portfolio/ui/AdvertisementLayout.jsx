import React from "react";
import { CTA } from "@/shared/components/ui/LinkButton";

export function AdvertisementLayout({ img = "/images/managed-postgres.png" }) {
    return (

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-x-8 items-center">
            <img src={img} alt="Managed Postgres" width="400" className="w-full max-w-sm mx-auto mb-6 lg:mb-0 object-contain" loading="lazy" />
            <div className="space-y-3">
                <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold text-emerald-700 bg-gradient-to-br from-green-300/50 to-emerald-300/50 ring-1 ring-emerald-500/35">NEW!</span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#0b1220]">Fly.io Managed Postgres</h2>
                <p className="text-lg text-[#374151]">A fully-managed database service that handles all aspects of running production PostgreSQL where we take care of:</p>
                <ul className="space-y-2 mt-4 text-base text-[#374151]">
                    <li className="flex items-start gap-3"><span className="text-emerald-500">•</span> Automatic backups and recovery</li>
                    <li className="flex items-start gap-3"><span className="text-emerald-500">•</span> High availability with automatic failover</li>
                    <li className="flex items-start gap-3"><span className="text-emerald-500">•</span> Performance monitoring and metrics</li>
                    <li className="flex items-start gap-3"><span className="text-emerald-500">•</span> Resource scaling (CPU, RAM, storage)</li>
                </ul>
                <div className="mt-6">
                    <CTA to="/docs/mpg" variant="primary">Learn More</CTA>
                </div>
            </div>
        </div>
    );
}