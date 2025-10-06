import React from "react";
import QuizCard from "./QuizCard";

export default function QuizPanel({ topicId, quizzes = [] }) {
    return (
        <div className="p-3 h-full overflow-auto">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Quizzes</h3>
                <div className="text-xs text-slate-400">{(quizzes || []).length}</div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {(!quizzes || quizzes.length === 0) && <div className="text-sm text-slate-500">No quizzes</div>}
                {(quizzes || []).map((q) => <QuizCard key={q._id} quiz={q} />)}
            </div>
        </div>
    );
}
