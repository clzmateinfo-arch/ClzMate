import React from "react";
import { Link } from "react-router-dom";

export default function SupportFilesPanel({ supportMaterials = [] }) {
    if (!Array.isArray(supportMaterials) || supportMaterials.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
                No support files available for this lecture.
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col gap-3">
            <div className="flex flex-col gap-2 overflow-auto m-5">
                {supportMaterials.map((m) => (
                    <div
                        key={m._id || m.publicId || m.url}
                        className="flex items-center justify-between gap-3 p-3 rounded border border-slate-700 bg-slate-900/40"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                                {m.originalName || (m.url && m.url.split("/").pop())}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                {m.mimeType || m.resourceType || ""} • {(m.size && `${Math.round(m.size / 1024)} KB`) || ""}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                to={m.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                                title="Open"
                            >
                                Open
                            </Link>

                            <Link
                                to={m.url}
                                download={m.originalName || ""}
                                className="px-3 py-1 rounded bg-slate-700 text-white text-sm"
                                title="Download"
                            >
                                Download
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
