 
import { useMemo, useState } from "react";
import { HiOutlineTag } from "react-icons/hi";

export default function CourseTags({
    tags = [],
    onTagClick = () => { },
    maxVisible = 6,
    className = "",
}) {
    const [expanded, setExpanded] = useState(false);

    const normalized = useMemo(
        () =>
            Array.isArray(tags)
                ? tags.map((t) => (typeof t === "string" ? t : t?.name ?? String(t)))
                : [],
        [tags]
    );

    const gradients = [
        "from-[#ba7bf0] to-[#996bec]",
        "from-[#34d399] to-[#10b981]",
        "from-[#60a5fa] to-[#3b82f6]",
        "from-[#fb923c] to-[#f97316]",
        "from-[#f472b6] to-[#fb7185]",
        "from-[#facc15] to-[#eab308]",
    ];

    const visibleCount = expanded ? normalized.length : Math.min(maxVisible, normalized.length);
    const hiddenCount = Math.max(0, normalized.length - visibleCount);

    if (!normalized.length) {
        return (
            <section className={`bg-transparent ${className}`}>
                <h3 className="text-base font-medium text-[#0b1220] mb-2">Tags</h3>
                <div className="text-sm text-[#6b7280]">No tags available.</div>
            </section>
        );
    }

    return (
        <section className={`bg-transparent ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-[#0b1220] flex items-center gap-2">
                    <HiOutlineTag className="w-5 h-5 text-[#6b7280]" />
                    Tags
                </h3>

                {normalized.length > maxVisible && (
                    <button
                        type="button"
                        onClick={() => setExpanded((s) => !s)}
                        className="text-sm text-[#6b7280] hover:text-[#4c1d95] transition"
                        aria-expanded={expanded}
                        aria-controls="course-tags-list"
                    >
                        {expanded ? "Show less" : `+${hiddenCount} more`}
                    </button>
                )}
            </div>

            <div id="course-tags-list" className="flex flex-wrap gap-2">
                {normalized.slice(0, visibleCount).map((t, i) => {
                    const grad = gradients[i % gradients.length];
                    return (
                        <button
                            key={t + i}
                            type="button"
                            onClick={() => onTagClick?.(t)}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#996bec]/40
                bg-gradient-to-r ${grad} text-white shadow-sm`}
                            title={t}
                            aria-label={`Filter by tag ${t}`}
                        >
                            <span className="truncate max-w-[12rem]">{t}</span>
                        </button>
                    );
                })}

                {!expanded && hiddenCount > 0 && (
                    <div className="flex items-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm text-[#6b7280] bg-white/6">
                            +{hiddenCount}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
