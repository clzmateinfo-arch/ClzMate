import React from "react";

export default function QuizCard({ quiz = {} }) {
    return (
        <div className="rounded-lg border p-3 bg-white">
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{quiz.title || "Quiz"}</div>
                    {quiz.description ? <div className="text-xs text-slate-500 mt-1 line-clamp-3">{quiz.description}</div> : null}
                </div>
                <div className="text-xs text-slate-400">{quiz.publish ? "Published" : "Draft"}</div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
                <button className="px-3 py-1 rounded bg-indigo-600 text-white">Start</button>
            </div>
        </div>
    );
}
