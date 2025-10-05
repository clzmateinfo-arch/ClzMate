import React from "react";
import { FiEdit, FiCopy, FiTrash2, FiUpload } from "react-icons/fi";

export default function AssignmentCard({
    assignment = {},
    onEdit,
    onDelete,
    onCopy,
    onToggle,
    className = ""
}) {
    const title = assignment.title || "Untitled Assignment";
    const points = assignment.points ?? null;
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const statusLabel = assignment.publish ? "Published" : "Draft";
    const subtitleParts = [];
    if (points !== null) subtitleParts.push(`${points} pts`);
    if (dueDate && !Number.isNaN(dueDate.getTime())) subtitleParts.push(`Due ${dueDate.toLocaleDateString()}`);
    const subtitle = subtitleParts.join(" • ");

    return (
        <div className={`relative w-full min-h-[150px] sm:min-w-[18rem] mx-1 rounded-lg border border-[#f3eff9]/70 bg-white p-3 transition hover:shadow-sm flex flex-col justify-between ${className}`}>
            <div>
                <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-[#8b5cf6]/10 to-[#7c3aed]/10 text-[#5b21b6] border border-[#efe6ff]">
                        Assignment
                    </span>
                </div>

                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-r from-[#ba7bf0]/10 to-[#996bec]/10 text-[#4c1d95]">
                        <span className="font-semibold text-sm md:text-base">A</span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-sm md:text-base font-medium text-[#0b1220] line-clamp-2 truncate">{title}</div>
                        {subtitle && <div className="text-xs md:text-sm text-[#6b7280] mt-1 truncate">{subtitle}</div>}
                    </div>
                </div>

                {assignment.instructions && (
                    <div className="mt-2 text-sm text-slate-600 line-clamp-3">{assignment.instructions}</div>
                )}
            </div>

            <div className="mt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className={`text-xs px-2 py-0.5 rounded ${assignment.publish ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                        {statusLabel}
                    </div>
                    {assignment.assigneeType && <div className="text-xs text-slate-400 bg-slate-50/50 px-2 py-0.5 rounded truncate">{assignment.assigneeType}</div>}
                </div>

                <div className="flex items-center gap-2">
                    {onEdit && <button onClick={onEdit} title="Edit" className="p-2 rounded hover:bg-black/5"><FiEdit className="w-4 h-4" /></button>}
                    {onCopy && <button onClick={onCopy} title="Copy" className="p-2 rounded hover:bg-black/5"><FiCopy className="w-4 h-4" /></button>}
                    {onDelete && <button onClick={onDelete} title="Delete" className="p-2 rounded hover:bg-black/5 text-red-600"><FiTrash2 className="w-4 h-4" /></button>}
                    {onToggle && <button onClick={onToggle} title="Toggle publish" className="p-2 rounded hover:bg-black/5"><FiUpload className="w-4 h-4" /></button>}
                </div>
            </div>
        </div>
    );
}
