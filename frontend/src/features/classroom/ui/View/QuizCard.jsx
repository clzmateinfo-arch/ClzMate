import React from "react";
import { FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function QuizCard({ quiz = {}, onStart = () => { }, onTogglePublish = () => { } }) {
    const title = quiz.title || "Quiz";
    const description = quiz.description || "";
    const published = !!quiz.publish;
    const navigate = useNavigate();

    return (
        <article
            className="group relative rounded-2xl bg-white dark:bg-slate-800/60 border border-transparent dark:border-slate-700/40
                 p-4 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200
                 overflow-hidden backdrop-blur-sm"
            aria-label={title}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                        {String(title || "Q").charAt(0).toUpperCase()}
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h4>
                        <div className={`text-xs px-2 py-1 rounded-md font-medium ${published ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300" : "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"}`}>
                            {published ? "Published" : "Draft"}
                        </div>
                    </div>

                    {description ? (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">{description}</p>
                    ) : (
                        <p className="text-xs text-slate-400 mt-2">No description</p>
                    )}

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                        {quiz.timeLimit ? (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/30">
                                <FiClock className="text-sm" /> {quiz.timeLimit} min
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">

                <div>
                    <button
                        onClick={() => navigate(`/quizz/${quiz._id}/play`)}
                        className="px-3 py-1 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition"
                    >
                        Start
                    </button>
                </div>
            </div>

            <div className="absolute -inset-0.5 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-400/5 to-purple-500/5 dark:from-indigo-400/6 dark:to-purple-500/6"></div>
            </div>
        </article>
    );
}
