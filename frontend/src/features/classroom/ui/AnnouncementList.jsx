// frontend/src/features/classroom/ui/AnnouncementList.jsx
import React from "react";
import AnnouncementCard from "./AnnouncementCard";
import { FiPlus } from "react-icons/fi";

/**
 * Props:
 * - items: array of announcements
 * - onView(item)
 * - onEdit(item)
 * - onDelete(item)
 * - onCreate() // optional (only shown for instructors)
 * - isInstructor (bool)
 */
export default function AnnouncementList({
    items = [],
    onView = () => { },
    onEdit = () => { },
    onDelete = () => { },
    onCreate = () => { },
    isInstructor = false,
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                {isInstructor && (
                    <button
                        onClick={onCreate}
                        className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        <FiPlus /> New
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-100 bg-white p-6 text-center text-slate-500">
                    No announcements yet.
                    {isInstructor && <div className="mt-2 text-sm">Create one to share an update with your class.</div>}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {items.map((a) => (
                        <AnnouncementCard
                            key={a._id || a.id}
                            announcement={a}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            isInstructor={isInstructor}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
