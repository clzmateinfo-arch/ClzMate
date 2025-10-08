// frontend/src/features/classroom/ui/AnnouncementCard.jsx
import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

/**
 * Props:
 * - announcement: { _id, title, body, pinned, author: { firstName, lastName, image }, meta: { createdAt } }
 * - onView(announcement)
 * - onEdit(announcement) // optional
 * - onDelete(announcement) // optional
 * - isInstructor (bool)
 */
export default function AnnouncementCard({
    announcement,
    onView = () => { },
    onEdit = () => { },
    onDelete = () => { },
    isInstructor = false,
}) {
    if (!announcement) return null;

    const {
        title,
        body,
        pinned,
        author = {},
        meta = {},
    } = announcement;

    const createdAt = meta?.createdAt ? new Date(meta.createdAt) : null;
    const authorName = author ? `${author.firstName || ""} ${author.lastName || ""}`.trim() || "Unknown" : "Unknown";

    return (
        <article
            className="w-full rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-lg transition p-4 flex gap-4 items-start"
            aria-labelledby={`ann-${announcement._id}-title`}
        >
            {/* left accent / avatar */}
            <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-lg font-semibold bg-gradient-to-br from-indigo-50 to-pink-50 border border-slate-100 `}>
                    {author?.image ? (
                        <img src={author.image} alt={authorName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-indigo-600">{authorName.split(" ").map(n => n[0] || "").slice(0, 2).join("")}</span>
                    )}
                </div>
            </div>

            {/* content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h4 id={`ann-${announcement._id}-title`} className="text-sm md:text-base font-semibold text-slate-900 truncate">
                            {title}
                        </h4>
                        <div className="mt-1 text-xs text-slate-500">{authorName} · {createdAt ? formatDistanceToNow(createdAt, { addSuffix: true }) : "—"}</div>
                    </div>

                    <div className="flex items-center gap-2">
                        {pinned && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                <FiMoreVertical className="text-sm" /> Pinned
                            </span>
                        )}

                        {isInstructor ? (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onEdit(announcement)}
                                    className="text-xs px-3 py-1 rounded-full border border-slate-100 text-slate-700 hover:bg-slate-50"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(announcement)}
                                    className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 hover:bg-red-100"
                                >
                                    Delete
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => onView(announcement)}
                                className="text-xs px-3 py-1 rounded-full border border-slate-100 text-slate-700 hover:bg-slate-50"
                            >
                                View
                            </button>
                        )}
                    </div>
                </div>

                <div
                    className="mt-3 text-sm text-slate-700 leading-relaxed line-clamp-3"
                    onClick={() => onView(announcement)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") onView(announcement); }}
                >
                    {/* small sanitized excerpt — rely on server to provide safe content */}
                    {body ? body : <span className="text-slate-400 italic">No details provided.</span>}
                </div>
            </div>
        </article>
    );
}
