import React from "react";
import { FiFileText, FiPlus, FiLink, FiList } from "react-icons/fi";
import Button from "@/shared/components/ui/Button";

/**
 * TopicCard
 *
 * Props:
 *  - topic: { _id, title, description, materials (array), assignmentsCount }
 *  - onOpen: (topic) => void
 *  - onCreateAssignment: (topic) => void
 *  - onAttachSubsection: (topic) => void
 *  - className: string
 */
export default function TopicCard({
    topic = {},
    onOpen,
    onCreateAssignment,
    onAttachSubsection,
    className = "",
}) {
    const { title, description, materials = [], assignmentsCount = 0 } = topic;

    return (
        <article className={`rounded-2xl border border-white/8 bg-white p-4 shadow-sm ${className}`}>
            <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-richblack-900">{title || "Untitled topic"}</h4>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">{description || "No description."}</p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <div className="inline-flex items-center gap-2">
                            <FiList className="w-4 h-4" />
                            <span>{assignmentsCount} assignment{assignmentsCount === 1 ? "" : "s"}</span>
                        </div>

                        <div className="inline-flex items-center gap-2">
                            <FiLink className="w-4 h-4" />
                            <span>{(materials || []).length} material{(materials || []).length === 1 ? "" : "s"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <Button variant="light" onClick={() => onOpen && onOpen(topic)} className="px-3 py-2 text-sm">
                        Open
                    </Button>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => onCreateAssignment && onCreateAssignment(topic)}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-2 bg-white/6 text-sm text-richblack-900 hover:brightness-95"
                        >
                            <FiPlus className="w-4 h-4" /> Assignment
                        </button>

                        <button
                            type="button"
                            onClick={() => onAttachSubsection && onAttachSubsection(topic)}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-2 bg-white/6 text-sm text-richblack-900 hover:brightness-95"
                        >
                            <FiFileText className="w-4 h-4" /> Attach
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
