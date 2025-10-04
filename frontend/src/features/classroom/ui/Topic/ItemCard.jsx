import { FiCopy, FiTrash2, FiEdit } from "react-icons/fi";

export default function ItemCard({ item = {}, onToggle, onDelete, onCopy, onEdit, className = "" }) {
    const isAssignment = !!(item.points || item.dueDate || item.assigneeType || item.publish !== undefined);
    const title = item.title || item.name || "Untitled";
    const subtitleParts = [];

    if (isAssignment) {
        if (item.points) subtitleParts.push(`${item.points} pts`);
        if (item.dueDate) {
            try {
                const d = new Date(item.dueDate);
                if (!Number.isNaN(d.getTime())) subtitleParts.push(`Due ${d.toLocaleDateString()}`);
            } catch { }
        }
    } else {
        if (item.type) subtitleParts.push(item.type);
        if (item.duration) subtitleParts.push(item.duration);
    }

    const subtitle = subtitleParts.join(" • ");
    const statusLabel = (item.publish || item.status === "published") ? "Published" : "Draft";
    const imageUrl = item.image || item.thumbnail || item.cover || (item.attachments && item.attachments[0]?.url) || null;
    const initials = (title || "Item").split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase();

    return (
        <div
            className={`w-full sm:min-w-[18rem] rounded-lg border border-[#f3eff9]/70 bg-white p-3 transition hover:shadow-sm flex flex-col justify-between ${className}`}
            role="group"
            aria-label={title}
        >
            <div>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-r from-[#ba7bf0]/10 to-[#996bec]/10 text-[#4c1d95]">
                        {imageUrl ? (
                            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-semibold text-sm md:text-base">{initials}</span>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-sm md:text-base font-medium text-[#0b1220] line-clamp-2 truncate">{title}</div>
                        {subtitle && <div className="text-xs md:text-sm text-[#6b7280] mt-1 truncate">{subtitle}</div>}
                    </div>
                </div>

                {item.instructions && (
                    <div className="mt-2 text-sm md:text-sm text-slate-600 line-clamp-3">{item.instructions}</div>
                )}
                {item.content && !item.instructions && (
                    <div className="mt-2 text-sm md:text-sm text-slate-600 line-clamp-3">{String(item.content).slice(0, 160)}</div>
                )}
            </div>

            <div className="mt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className={`text-xs px-2 py-0.5 rounded ${item.publish || item.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                        {statusLabel}
                    </div>
                    {isAssignment && item.assigneeType && <div className="text-xs text-slate-400 bg-slate-50/50 px-2 py-0.5 rounded truncate">{item.assigneeType} students</div>}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            title="Edit"
                            aria-label="Edit item"
                            className="p-2 rounded hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-200"
                        >
                            <FiEdit className="w-4 h-4" />
                        </button>
                    )}
                    {onCopy && (
                        <button
                            onClick={onCopy}
                            title="Copy"
                            aria-label="Copy item"
                            className="p-2 rounded hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-200"
                        >
                            <FiCopy className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            title="Delete"
                            aria-label="Delete item"
                            className="p-2 rounded hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-200 text-red-600"
                        >
                            <FiTrash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
