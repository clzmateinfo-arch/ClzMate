import React from "react";
import { FiChevronRight } from "react-icons/fi";
import { TfiPin2 } from "react-icons/tfi";
import Button from "@/shared/components/ui/Button";

/**
 * AnnouncementList
 *
 * Props:
 *  - items: array of announcements (each should contain _id, title, body, author, createdAt, pinned)
 *  - onView: (announcement) => void   // optional: called when user clicks "View"
 *  - compact: boolean                 // optional: simpler compact render
 *  - className: string                // optional tailwind classes
 */
export default function AnnouncementList({ items = [], onView, compact = false, className = "" }) {
    if (!items || items.length === 0) {
        return <div className={`py-6 text-sm text-slate-500 ${className}`}>No announcements</div>;
    }

    return (
        <div className={`${className} space-y-3`}>
            {items.map((a) => {
                const when = a?.createdAt ? new Date(a.createdAt).toLocaleString() : "";
                const authorName = a?.author ? `${a.author.firstName || ""} ${a.author.lastName || ""}`.trim() : " ";

                return (
                    <article
                        key={a._id}
                        className={`rounded-2xl border border-white/8 bg-white p-4 shadow-sm hover:shadow-md transition`}
                        aria-labelledby={`announcement-${a._id}-title`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-3">
                                    <h4 id={`announcement-${a._id}-title`} className="text-sm font-semibold text-richblack-900 truncate">
                                        {a.title}
                                    </h4>

                                    {a.pinned && (
                                        <span className="inline-flex items-center gap-1 text-xs rounded px-2 py-0.5 bg-[#fff7e6] text-[#7c5a00]">
                                            <TfiPin2 className="w-3 h-3" /> Pinned
                                        </span>
                                    )}
                                </div>

                                {!compact && (
                                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                                        {a.body || <span className="text-slate-400 italic">No content</span>}
                                    </p>
                                )}

                                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                                    <div>By {authorName}</div>
                                    <div>•</div>
                                    <time dateTime={a.createdAt || ""}>{when}</time>
                                </div>
                            </div>

                            <div className="flex-shrink-0 flex items-center gap-2">
                                {typeof onView === "function" ? (
                                    <Button
                                        variant="light"
                                        onClick={() => onView(a)}
                                        className="px-3 py-2 text-sm"
                                        aria-label={`View announcement ${a.title}`}
                                    >
                                        View
                                    </Button>
                                ) : (
                                    <button
                                        type="button"
                                        aria-hidden
                                        className="p-2 rounded-md text-slate-500 hover:bg-white/6"
                                        onClick={() => onView && onView(a)}
                                    >
                                        <FiChevronRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
