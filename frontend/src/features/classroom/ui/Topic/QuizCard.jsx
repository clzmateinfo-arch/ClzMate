import { FiEdit, FiCopy, FiTrash2, FiUpload } from "react-icons/fi";

export default function QuizCard({
    quiz = {},
    onEdit,
    onDelete,
    onCopy,
    onToggle,
    className = ""
}) {
    const title = quiz.title || quiz.name || "Untitled Quiz";
    const screens = quiz.screens?.length ?? quiz.screenCount ?? quiz.numScreens ?? 0;
    const timeLimit = quiz.timeLimit ?? null;
    const maxScore = quiz.maxScore ?? null;
    const subtitleParts = [];
    if (screens) subtitleParts.push(`${screens} screen${screens === 1 ? "" : "s"}`);
    if (timeLimit) subtitleParts.push(`${timeLimit} sec`);
    if (maxScore) subtitleParts.push(`${maxScore} pts`);
    const subtitle = subtitleParts.join(" • ");
    const statusLabel = quiz.publish ? "Published" : "Draft";

    return (
        <div className={`relative w-full min-h-[150px] sm:min-w-[18rem] mx-1 rounded-lg border border-[#f3eff9]/70 bg-white p-3 transition hover:shadow-sm flex flex-col justify-between ${className}`}>
            <div>
                <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Quiz
                    </span>
                </div>

                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-r from-[#f6d365]/10 to-[#fda085]/10 text-[#c2410c]">
                        <span className="font-semibold">Q</span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-sm md:text-base font-medium text-[#0b1220] line-clamp-2 truncate">{title}</div>
                        {subtitle && <div className="text-xs md:text-sm text-[#6b7280] mt-1 truncate">{subtitle}</div>}
                    </div>
                </div>

                {quiz.instructions && <div className="mt-2 text-sm text-slate-600 line-clamp-3">{quiz.instructions}</div>}
            </div>

            <div className="mt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className={`text-xs px-2 py-0.5 rounded ${quiz.publish ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>{statusLabel}</div>
                </div>

                <div className="flex items-center gap-2">
                    {onEdit && <button onClick={onEdit} title="Edit" className="p-2 rounded hover:bg-black/5"><FiEdit className="w-4 h-4" /></button>}
                    {onCopy && <button onClick={onCopy} title="Copy" className="p-2 rounded hover:bg-black/5"><FiCopy className="w-4 h-4" /></button>}
                    {onDelete && <button onClick={onDelete} title="Delete" className="p-2 rounded hover:bg-black/5 text-red-600"><FiTrash2 className="w-4 h-4" /></button>}
                    {onToggle && <button onClick={onToggle} title="Toggle publish" className="p-2 rounded hover:bg-black/5"><FiUpload className="w-4 h-4" /></button>}
                </div>
            </div>
        </div>
    );
}
