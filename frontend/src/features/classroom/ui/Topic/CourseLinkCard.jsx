import { FiLink, FiTrash2, FiEdit, FiCopy, FiUpload } from "react-icons/fi";

export default function CourseLinkCard({
    item = {},
    onEdit,
    onDelete,
    onCopy,
    onToggle,
    className = "",
}) {
    const title = item.title || item.name || "Linked Course";
    const subtitle = item.description || item.summary || item.content || "";
    const imageUrl =
        item.linkedCourse?.image ||
        item.image ||
        (item.attachments && item.attachments[0]?.url) ||
        null;
    const provider =
        (item.linkedCourse && (item.linkedCourse.instructorName || item.linkedCourse.title)) ||
        item.provider ||
        "";

    const isPublished = Boolean(item.status === "published" || item.publish);

    return (
        <div
            className={`relative w-full min-h-[170px] sm:min-w-[18rem] mx-1 rounded-lg border border-[#f3eff9]/70 bg-white p-3 transition hover:shadow-sm flex flex-col justify-between ${className}`}
            role="group"
            aria-label={title}
        >
            <div>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-r from-[#ba7bf0]/10 to-[#996bec]/10 text-[#4c1d95]">
                        {imageUrl ? (
                            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                        ) : (
                            <FiLink className="w-6 h-6" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-sm md:text-base font-medium text-[#0b1220] line-clamp-2 truncate">
                            {title}
                        </div>
                        {provider ? (
                            <div className="text-xs md:text-sm text-[#6b7280] mt-1 truncate">
                                {provider}
                            </div>
                        ) : null}
                    </div>
                </div>

                {subtitle ? (
                    <div className="mt-2 text-sm md:text-sm text-slate-600 line-clamp-3">{subtitle}</div>
                ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className={`text-xs px-2 py-0.5 rounded ${isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                        {isPublished ? "Published" : "Draft"}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button onClick={onEdit} title="Edit" className="p-2 rounded hover:bg-black/5">
                            <FiEdit className="w-4 h-4" />
                        </button>
                    )}
                    {onCopy && (
                        <button onClick={onCopy} title="Copy" className="p-2 rounded hover:bg-black/5">
                            <FiCopy className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={onDelete} title="Delete" className="p-2 rounded hover:bg-black/5 text-red-600">
                            <FiTrash2 className="w-4 h-4" />
                        </button>
                    )}
                    {onToggle && (
                        <button
                            onClick={() => {
                                try {
                                    onToggle(item);
                                } catch (err) {
                                    console.error("publish toggle error", err);
                                }
                            }}
                            title={isPublished ? "Unpublish" : "Publish"}
                            className={`p-2 rounded`}
                            aria-pressed={isPublished}
                        >
                            <FiUpload className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
