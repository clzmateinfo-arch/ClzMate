// frontend/src/features/classroom/ui/Topic/ItemCard.jsx
import React from "react";
import { FiCopy, FiTrash2, FiEdit } from "react-icons/fi";

/**
 * ItemCard - supports generic items (material, assignment, quiz, link, etc.)
 *
 * Props:
 * - item: object (may be an "assignment" or a generic topic item)
 * - onToggle: toggle publish/status (optional)
 * - onDelete: delete callback (optional)
 * - onCopy: copy callback (optional)
 * - onEdit: edit callback (optional)
 * - className: optional extra classes
 */
export default function ItemCard({ item = {}, onToggle, onDelete, onCopy, onEdit, className = "" }) {
    const isAssignment = !!(item.points || item.dueDate || item.assigneeType || item.publish !== undefined);
    const title = item.title || item.name || "Untitled";
    const subtitleParts = [];

    if (isAssignment) {
        if (item.points) subtitleParts.push(`${item.points} pts`);
        if (item.dueDate) {
            try {
                const d = new Date(item.dueDate);
                if (!Number.isNaN(d.getTime())) subtitleParts.push(`Due ${d.toLocaleDateString()}`);
            } catch { }
        }
    } else {
        if (item.type) subtitleParts.push(item.type);
        if (item.duration) subtitleParts.push(item.duration);
    }

    const subtitle = subtitleParts.join(" • ");

    const statusLabel = (item.publish || item.status === "published") ? "Published" : "Draft";

    const imageUrl = item.image || item.thumbnail || item.cover || (item.attachments && item.attachments[0]?.url) || null;
    const initials = (title || "Item").split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase();

    return (
        <div
            className={`w-72 min-w-[18rem] rounded-lg border border-[#f3eff9]/30 bg-white p-3 transition hover:shadow-sm flex flex-col justify-between ${className}`}
            role="group"
            aria-label={title}
        >
            <div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-r from-[#ba7bf0]/10 to-[#996bec]/10 text-[#4c1d95]">
                        {imageUrl ? (
                            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-semibold">{initials}</span>
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="text-sm font-medium text-[#0b1220] line-clamp-2 truncate">{title}</div>
                        {subtitle && <div className="text-xs text-[#6b7280] mt-1">{subtitle}</div>}
                    </div>
                </div>

                {item.instructions && (
                    <div className="mt-2 text-sm text-slate-600 line-clamp-3">{item.instructions}</div>
                )}
                {item.content && !item.instructions && (
                    <div className="mt-2 text-sm text-slate-600 line-clamp-3">{String(item.content).slice(0, 160)}</div>
                )}
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`text-xs px-2 py-0.5 rounded ${item.publish || item.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                        {statusLabel}
                    </div>
                    {isAssignment && item.assigneeType && <div className="text-xs text-slate-400">{item.assigneeType}</div>}
                </div>

                <div className="flex items-center gap-2">
                    {onEdit && (
                        <button onClick={onEdit} title="Edit" className="p-2 rounded hover:bg-white/8">
                            <FiEdit />
                        </button>
                    )}
                    {onCopy && (
                        <button onClick={onCopy} title="Copy" className="p-2 rounded hover:bg-white/8">
                            <FiCopy />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={onDelete} title="Delete" className="p-2 rounded hover:bg-white/8 text-red-600">
                            <FiTrash2 />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
