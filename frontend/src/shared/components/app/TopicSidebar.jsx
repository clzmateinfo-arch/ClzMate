// frontend/src/features/classroom/ui/View/TopicSidebar.jsx
import React, { useMemo } from "react";

export default function TopicSidebar({ topics = [], selectedTopicId, onSelect = () => { } }) {
    const grouped = useMemo(() => (Array.isArray(topics) ? topics : []), [topics]);
    return (
        <div className="w-full h-full p-3 overflow-auto">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Topics</h3>
                <div className="text-xs text-slate-500">{(topics || []).length}</div>
            </div>

            <div className="space-y-2">
                {grouped.length === 0 && <div className="text-sm text-slate-400">No topics</div>}
                {grouped.map((t) => (
                    <button
                        key={t._id}
                        onClick={() => onSelect && onSelect(t._id)}
                        className={`w-full text-left p-2 rounded-md transition ${String(t._id) === String(selectedTopicId) ? "bg-violet-50 border border-violet-200" : "hover:bg-gray-50"}`}
                        title={t.title}
                    >
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{t.title}</div>
                                {t.description ? <div className="text-xs text-slate-500 truncate">{t.description}</div> : null}
                            </div>
                            <div className="text-xs text-slate-400 ml-2">{(t.assignmentsCount || 0)}A</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
