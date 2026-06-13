import { FiLink, FiEdit, FiCopy, FiTrash2 } from "react-icons/fi";

export default function LinkCard({
    item = {},
    onEdit,
    onDelete,
    onCopy,
    className = ""
}) {
    const title = item.title || item.name || item.sourceTitle || "Linked content";
    const url = item.url || item.link || item.destination || "";
    const subtitle = url ? (new URL(url, "http://example.com").hostname || url) : (item.type || "Link");

    return (
        <div className={`relative w-full min-h-[170px] sm:min-w-[18rem] mx-1 rounded-lg border border-[#f3eff9]/70 bg-white p-3 transition hover:shadow-sm flex flex-col justify-between ${className}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-r from-[#c7f9cc]/10 to-[#8be9b8]/10 text-[#0b6b3a]">
                    <FiLink className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="text-sm md:text-base font-medium text-[#0b1220] line-clamp-2 truncate">{title}</div>
                    <div className="text-xs text-[#6b7280] mt-1 truncate">{subtitle}</div>
                </div>
            </div>

            {item.description && <div className="mt-2 text-sm text-slate-600 line-clamp-3">{item.description}</div>}

            <div className="mt-3 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500">{url ? "Linked" : "Subsection"}</div>

                <div className="flex items-center gap-2">
                    {onEdit && <button onClick={onEdit} title="Edit" className="p-2 rounded hover:bg-black/5"><FiEdit className="w-4 h-4" /></button>}
                    {onCopy && <button onClick={onCopy} title="Copy" className="p-2 rounded hover:bg-black/5"><FiCopy className="w-4 h-4" /></button>}
                    {onDelete && <button onClick={onDelete} title="Delete" className="p-2 rounded hover:bg-black/5 text-red-600"><FiTrash2 className="w-4 h-4" /></button>}
                </div>
            </div>
        </div>
    );
}
