import React from "react";
import { FiDownload } from "react-icons/fi";

export default function MaterialCard({ item = {}, topicId, token }) {
    const title = item.title || item.name || "Material";
    const files = item.attachments || [];

    return (
        <div className="rounded-lg border p-3 bg-white">
            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{title}</div>
                    {item.content ? <div className="text-xs text-slate-500 mt-1 line-clamp-3">{item.content}</div> : null}
                </div>
                <div className="text-xs text-slate-400">{item.status === "published" ? "Published" : "Draft"}</div>
            </div>

            <div className="mt-3 space-y-2">
                {files.length === 0 && <div className="text-sm text-slate-500">No files</div>}
                {files.map((f) => (
                    <div key={f._id || f.publicId || f.url} className="flex items-center justify-between p-2 rounded border">
                        <div className="min-w-0">
                            <div className="text-sm truncate">{f.originalName || f.url}</div>
                            <div className="text-xs text-slate-400">{f.mimeType || ""}</div>
                        </div>
                        <div>
                            <a href={f.url} target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-black/5">
                                <FiDownload />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
