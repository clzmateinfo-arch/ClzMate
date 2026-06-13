import QuizCard from "./QuizCard";

export default function QuizPanel({ _topicId, quizzes = [], onStart = () => { }, onTogglePublish = () => { } }) {
    const published = (quizzes || []).filter(q => q && q.publish === true);
    const count = published.length;

    return (
        <div className="p-3 h-full overflow-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{count} item{count !== 1 ? "s" : ""}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                {published.length === 0 && <div className="col-span-full text-sm text-slate-500 dark:text-slate-400">No quizzes</div>}
                {published.map(q => (
                    <QuizCard
                        key={q._id || q.id}
                        quiz={q}
                        onStart={() => onStart(q)}
                        onTogglePublish={() => onTogglePublish(q)}
                    />
                ))}
            </div>
        </div>
    );
}
