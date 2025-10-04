import React from "react";
import { FiClock, FiFileText, FiUpload, FiEye } from "react-icons/fi";
import Button from "@/shared/components/ui/Button";

/**
 * AssignmentCard
 *
 * Props:
 *  - assignment: object { _id, title, description, dueDate, maxScore, createdBy, resources }
 *  - isInstructor: boolean
 *  - isStudent: boolean
 *  - onSubmit: (assignment) => void
 *  - onViewSubmissions: (assignment) => void
 *  - className: string
 */
export default function AssignmentCard({
    assignment = {},
    isInstructor = false,
    isStudent = false,
    onSubmit,
    onViewSubmissions,
    className = "",
}) {
    const { title, description, dueDate, maxScore } = assignment;
    const dueText = dueDate ? new Date(dueDate).toLocaleString() : "No due date";

    return (
        <article className={`rounded-2xl border border-white/8 bg-white p-4 shadow-sm ${className}`}>
            <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-richblack-900">{title || "Untitled assignment"}</h4>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">{description || "No description provided."}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <div className="inline-flex items-center gap-2">
                            <FiClock className="w-4 h-4" />
                            <span>Due: {dueText}</span>
                        </div>

                        <div className="inline-flex items-center gap-2">
                            <FiFileText className="w-4 h-4" />
                            <span>Max: {typeof maxScore === "number" ? maxScore : " "}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {isStudent && (
                        <Button onClick={() => onSubmit && onSubmit(assignment)} className="px-3 py-2" aria-label="Submit assignment">
                            <span className="flex items-center gap-2"><FiUpload /> Submit</span>
                        </Button>
                    )}

                    {isInstructor && (
                        <Button variant="light" onClick={() => onViewSubmissions && onViewSubmissions(assignment)} className="px-3 py-2">
                            <span className="flex items-center gap-2"><FiEye /> Submissions</span>
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
}
