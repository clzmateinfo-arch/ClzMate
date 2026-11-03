import { usePublicResource } from "@/shared/snapshot/dataCache";


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

const toStatTiles = (stats) => [
  { count: stats.totalStudents != null ? String(stats.totalStudents) : " ", label: "Active students" },
  { count: stats.mentors != null ? String(stats.mentors) : " ", label: "Mentors" },
  { count: stats.courses != null ? String(stats.courses) : " ", label: "Courses" },
  { count: stats.awards != null ? String(stats.awards) : " ", label: "Completions" },
];

export default function StatsComponenet() {
  const { data: stats, isSettled } = usePublicResource("stats");
  const loading = !isSettled;
  const show = stats ? toStatTiles(stats) : FALLBACK;

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
