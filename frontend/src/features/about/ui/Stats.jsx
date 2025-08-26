/* eslint-disable react/no-unescaped-entities */
import React from "react";

/**
 * StatsComponenet
 *
 * - Uses glass-style cards consistent with the rest of the site
 * - Semantic <dl>/<dt>/<dd> structure for accessibility
 * - Responsive grid: 1 col on small, 4 cols on md+
 */

const STATS = [
  { count: "5K", label: "Active students" },
  { count: "10+", label: "Mentors" },
  { count: "200+", label: "Courses" },
  { count: "50+", label: "Awards" },
];

export default function StatsComponenet() {
  return (
    <section
      aria-labelledby="site-stats-title"
      className="py-12 bg-transparent"
    >
      <div className="mx-auto w-11/12 max-w-maxContent">
        <header className="mb-6 text-center">
          <h2 id="site-stats-title" className="text-2xl font-semibold text-black">
            Our Impact
          </h2>
          <p className="mt-2 text-sm text-black">
            Real outcomes for learners, numbers that matter
          </p>
        </header>

        <dl className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {STATS.map((s, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm flex flex-col items-start"
              role="group"
              aria-labelledby={`stat-${idx}-label`}
            >
              <dt className="text-sm font-medium text-black mb-1"> 
                <span id={`stat-${idx}-label`} className="sr-only">
                  {s.label}
                </span>
              </dt>

              <dd className="flex items-baseline gap-3 w-full">
                <div className="inline-flex items-center justify-center rounded-lg px-3 py-2 bg-gradient-to-br from-[#ba7bf0]/10 to-[#996bec]/10 ring-1 ring-[#e9e0ff]">
                  <span className="text-2xl font-bold text-black">{s.count}</span>
                </div>

                <div className="flex-1">
                  <p className="text-base font-semibold text-black">{s.label}</p>
                  <p className="mt-1 text-xs text-black">Trusted by learners worldwide</p>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
