import { useEffect, useState } from "react";
import { apiConnector } from "@/shared/services/api/apiConnector";
import { toast } from "react-hot-toast";
import { commanEndpoints } from "@/app/config/apis";

const { SITE_STATS_API } = commanEndpoints;


const FALLBACK = [
  { count: "5K", label: "Active students" },
  { count: "10+", label: "Mentors" },
  { count: "200+", label: "Courses" },
  { count: "50+", label: "Awards" },
];

function SkeletonTile() {
  return (
    <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm flex flex-col items-start animate-pulse">
      <div className="h-6 w-20 rounded bg-gray-200/30 mb-3" />
      <div className="h-8 w-16 rounded bg-gray-200/30" />
      <div className="h-3 w-full mt-4 rounded bg-gray-200/20" />
    </div>
  );
}

export default function StatsComponenet() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiConnector("GET", SITE_STATS_API);
        if (!mounted) return;
        if (res?.data?.success && res.data.data) {
          const d = res.data.data;
          const mapped = [
            { count: d.totalStudents != null ? String(d.totalStudents) : " ", label: "Active students" },
            { count: d.mentors != null ? String(d.mentors) : " ", label: "Mentors" },
            { count: d.courses != null ? String(d.courses) : " ", label: "Courses" },
            { count: d.awards != null ? String(d.awards) : " ", label: "Compltions" },
          ];
          setStats(mapped);
        } else {
          throw new Error(res?.data?.message || "Invalid response");
        }
      } catch (err) {
        console.error("Failed to load stats", err);
        toast.error("Could not load site stats   showing defaults");
        setStats(FALLBACK);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const show = stats ?? FALLBACK;

  return (
    <section aria-labelledby="site-stats-title" className="py-12 bg-transparent">
      <div className="mx-auto w-11/12 max-w-maxContent">
        <header className="mb-6 text-center">
          <h2 id="site-stats-title" className="text-2xl font-semibold text-black">
            Our Impact
          </h2>
          <p className="mt-2 text-sm text-black">Real outcomes for learners, numbers that matter</p>
        </header>

        {loading ? (
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SkeletonTile />
            <SkeletonTile />
            <SkeletonTile />
            <SkeletonTile />
          </dl>
        ) : (
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {show.map((s, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm flex flex-col items-start"
                role="group"
                aria-labelledby={`stat-${idx}-label`}
              >
                <dt className="text-sm font-medium text-black mb-1">
                  <span id={`stat-${idx}-label`} className="sr-only">{s.label}</span>
                </dt>

                <dd className="flex items-baseline gap-3 w-full">
                  <div className="inline-flex items-center justify-center rounded-lg px-3 py-2 bg-gradient-to-br from-[#ba7bf0]/10 to-[#996bec]/10 ring-1 ring-[#e9e0ff]">
                    <span className="text-2xl font-bold text-black">{s.count}</span>
                  </div>

                  <div className="flex-1">
                    <p className="text-base font-semibold text-black">{s.label}</p>
                    {/* <p className="mt-1 text-xs text-black">Trusted by learners worldwide</p> */}
                  </div>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
