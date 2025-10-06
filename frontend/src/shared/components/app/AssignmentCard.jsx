import React, { useState } from "react";
import { FiDownload } from "react-icons/fi";

export default function AssignmentCard({ assignment = {}, onTogglePublish = () => { } }) {
    const [submitting, setSubmitting] = useState(false);
    const title = assignment.title || "Assignment";
    const due = assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : null;
    const attachments = assignment.attachments || [];

    return (
        <div className="rounded-lg border p-3 bg-white">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{title}</div>
                    {assignment.instructions ? <div className="text-xs text-slate-500 mt-1 line-clamp-3">{assignment.instructions}</div> : null}
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        {assignment.points ? <div>{assignment.points} pts</div> : null}
                        {due ? <div>Due: {due}</div> : null}
                        <div>{assignment.assigneeType || "all"}</div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className={`text-xs px-2 py-1 rounded ${assignment.publish ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                        {assignment.publish ? "Published" : "Draft"}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onTogglePublish} className="px-2 py-1 rounded bg-white border text-sm">
                            {assignment.publish ? "Unpublish" : "Publish"}
                        </button>
                    </div>
                </div>
            </div>

            {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                    {attachments.map((att) => (
                        <div key={att._id || att.publicId || att.url} className="flex items-center justify-between p-2 rounded border">
                            <div className="min-w-0">
                                <div className="text-sm truncate">{att.originalName || att.url}</div>
                                <div className="text-xs text-slate-400">{att.mimeType || ""}</div>
                            </div>
                            <div>
                                <a className="p-2 rounded hover:bg-black/5" href={att.url} target="_blank" rel="noreferrer">
                                    <FiDownload />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-3 flex items-center justify-end gap-2">
                <button disabled={submitting} className="px-3 py-1 rounded bg-indigo-600 text-white">
                    {submitting ? "Submitting..." : "Submit"}
                </button>
            </div>
        </div>
    );
}
