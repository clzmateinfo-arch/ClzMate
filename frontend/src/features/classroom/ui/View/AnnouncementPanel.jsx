import React from "react";
import AssignmentCard from "./AssignmentCard";

export default function AssignmentPanel({
    assignments = [],
    onTogglePublish = () => { },
    onSubmit = () => { },
}) {
    const count = (assignments || []).length;

    return (
        <div className="p-3 h-full overflow-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Assignments</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{count} item{count !== 1 ? "s" : ""}</div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="text-xs px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md transition"
                    >
                        New assignment
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(!assignments || assignments.length === 0) && (
                    <div className="col-span-full text-sm text-slate-500 dark:text-slate-400">No assignments</div>
                )}

                {(assignments || []).map((a) => (
                    <AssignmentCard
                        key={a._id || a.id || a.title}
                        assignment={a}
                        onTogglePublish={() => onTogglePublish(a)}
                        onSubmit={() => onSubmit(a)}
                    />
                ))}
            </div>
        </div>
    );
}
