// frontend/src/features/classroom/ui/View/SectionSidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * SectionSidebar - for classroom we show linked course sections/subsections inside a topic
 * topic prop is the selected topic that may have items of type 'subsection' with link/refId
 */
export default function SectionSidebar({ topic = null, onOpenSub = () => { } }) {
    const linked = (topic?.items || []).filter((it) => it.type === "subsection" && (it.link || it.refId));
    const navigate = useNavigate();

    return (
        <div className="p-3 h-full overflow-auto">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Sections</h3>
                <div className="text-xs text-slate-400">{linked.length}</div>
            </div>

            {linked.length === 0 && <div className="text-sm text-slate-400">No linked sections</div>}

            <div className="space-y-2">
                {linked.map((l) => (
                    <div key={l._id} className="p-2 rounded-md border hover:shadow-sm bg-white">
                        <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{l.title}</div>
                                {l.content ? <div className="text-xs text-slate-500 truncate">{l.content}</div> : null}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {l.link ? (
                                    <button
                                        onClick={() => {
                                            try {
                                                navigate(l.link);
                                            } catch {
                                                window.open(l.link, "_blank");
                                            }
                                        }}
                                        className="px-2 py-1 text-xs rounded bg-indigo-600 text-white"
                                    >
                                        Open
                                    </button>
                                ) : (
                                    <button onClick={() => onOpenSub(l)} className="px-2 py-1 text-xs rounded bg-gray-100">
                                        Open
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
