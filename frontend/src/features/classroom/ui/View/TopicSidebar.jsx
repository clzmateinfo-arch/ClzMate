import { useMemo } from "react";

export default function TopicSidebar({ topics = [], selectedTopicId, onSelect = () => { }, forceVisible = false }) {
    const grouped = useMemo(() => (Array.isArray(topics) ? topics : []), [topics]);

    return (
        <aside
            className={
                forceVisible
                    ? "w-full h-full bg-gradient-to-b from-slate-900/95 to-slate-900/95 flex flex-col overflow-hidden"
                    : "w-full max-w-sm bg-gradient-to-b from-slate-900/80 to-slate-900/70 border-r border-slate-800 h-full flex flex-col overflow-hidden hidden lg:flex"
            }
            aria-label="Topics"
        >
            {/* Fixed header */}
            <div className="flex-none px-4 pt-4 pb-3 border-b border-slate-800/60">
                <div className="min-w-0">
                    <h4 className="font-semibold text-lg text-white leading-tight truncate">Topics</h4>
                    <p className="text-xs text-slate-400 mt-1 truncate">{(grouped || []).length} topic{(grouped || []).length !== 1 ? "s" : ""}</p>
                </div>
            </div>

            {/* Scrollable topics list */}
            <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll px-4">
                <div className="space-y-3 py-3">
                    {grouped.length === 0 && <div className="text-sm text-slate-400">No topics available.</div>}

                    {grouped.map((t) => {
                        const id = t._id || t.id;
                        const title = t.title || t.name || "Untitled topic";
                        const description = t.description || "";
                        const itemsCount = Array.isArray(t.items) ? t.items.length : (t.assignmentsCount ?? t.itemCount ?? 0);
                        const isActive = String(id) === String(selectedTopicId);

                        return (
                            <div key={id} className="group my-2">
                                <button
                                    aria-expanded={isActive}
                                    onClick={() => onSelect && onSelect(id)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            onSelect && onSelect(id);
                                        }
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors duration-200
                                        ${isActive ? "bg-indigo-700/40 text-white" : "bg-slate-800/20 text-slate-200 hover:bg-slate-800/30"}`}
                                    title={title}
                                    type="button"
                                >
                                    <div className="flex items-center gap-3 truncate min-w-0">
                                        <div className="w-9 h-9 flex items-center justify-center rounded-md bg-white/5 text-sm font-semibold">
                                            {title ? title.charAt(0).toUpperCase() : "T"}
                                        </div>

                                        <div className="min-w-0 text-left">
                                            <div className="text-sm font-medium truncate">{title}</div>
                                            {description ? <div className="text-xs text-slate-400 mt-0.5 truncate">{description}</div> : null}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider transition-all duration-200
                                            ${isActive ? "bg-white/10 text-white" : "bg-white/5 text-slate-200 group-hover:bg-indigo-600 group-hover:text-white"}`}>
                                            {isActive ? "Open" : "View"}
                                        </div>

                                        <div className="text-xs text-slate-400 ml-2">{itemsCount} item{itemsCount !== 1 ? "s" : ""}</div>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="text-xs text-slate-400 py-3 border-t border-slate-800/50">
                    <p>{(grouped || []).length} topics • {(grouped || []).reduce((acc, t) => acc + (Array.isArray(t.items) ? t.items.length : (t.itemCount ?? 0)), 0)} items</p>
                </div>
            </div>
        </aside>
    );
}
