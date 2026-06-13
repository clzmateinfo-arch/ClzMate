import { useState, useEffect } from "react";
import { FiPaperclip, FiX } from "react-icons/fi";
import ResourceViewer from "@/shared/components/app/ResourceViewer";
import PlayerPanel from "@/shared/components/app/PlayerPanel";
import ExternalVideo from "@/shared/components/app/ExternalVideo";
import { MdOutlinePreview } from "react-icons/md";

export default function MaterialCard({ item = {}, _topicId, token, _onTogglePublish = () => { } }) {
    const title = item.title || item.name || "Material";
    const content = item.content || "";
    const files = item.attachments || [];
    const published = item.status === "published";

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewResource, setPreviewResource] = useState(null);

    useEffect(() => {
        if (previewOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev || "";
            };
        }
    }, [previewOpen]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape" && previewOpen) {
                setPreviewOpen(false);
                setPreviewResource(null);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [previewOpen]);

    const openPreview = (file) => {
        if (!file) return;
        setPreviewResource(file);
        setPreviewOpen(true);
    };

    const isYoutubeLike = (url) => {
        if (!url || typeof url !== "string") return false;
        const u = url.toLowerCase();
        return u.includes("youtube.com") || u.includes("youtu.be") || u.includes("vimeo.com");
    };

    const mt = (r = {}) => (r.mimeType || "").toLowerCase();
    const name = (r = {}) => (r.originalName || "").toLowerCase();

    const isVideoResource = (r = {}) =>
        (r.resourceType || "").toString().startsWith("video") ||
        (mt(r) && mt(r).startsWith("video")) ||
        /\.(mp4|webm|mov)$/i.test(r.url || r.originalName || "");

    const isPdfResource = (r = {}) =>
        mt(r) === "application/pdf" || (name(r) || "").endsWith(".pdf") || ((r.resourceType || "").startsWith("raw") && (name(r) || "").endsWith(".pdf"));

    return (
        <>
            <article
                className="group relative rounded-2xl bg-white dark:bg-slate-800/60 border border-transparent dark:border-slate-700/40
                 p-4 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200
                 overflow-hidden backdrop-blur-sm"
                aria-label={title}
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                            {String(title || "M").charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h4>
                            <div
                                className={`text-xs px-2 py-1 rounded-md font-medium ${published ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300" : "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"
                                    }`}
                            >
                                {published ? "Published" : "Draft"}
                            </div>
                        </div>

                        {content ? (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">{content}</p>
                        ) : (
                            <p className="text-xs text-slate-400 mt-2">No description</p>
                        )}

                        <div className="mt-3 space-y-2">
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-300 gap-2 font-medium">
                                <FiPaperclip /> Files
                            </div>

                            {files.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No files</div>}

                            <div className="grid grid-cols-1 gap-2">
                                {files.map((f) => {
                                    const key = f._id || f.publicId || f.url || Math.random().toString(36).slice(2);
                                    return (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30"
                                        >
                                            
                                            <div
                                                className="min-w-0 cursor-pointer"
                                                onClick={() => openPreview(f)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") openPreview(f);
                                                }}
                                                aria-label={`View ${f.originalName || f.url}`}
                                            >
                                                <div className="text-sm truncate text-slate-800 dark:text-slate-100">{f.originalName || f.url}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-300">{f.mimeType || ""}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer text-slate-600 dark:text-slate-300"
                                                    onClick={(_e) => openPreview(f)}
                                                >
                                                    <MdOutlinePreview />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <div />
                </div>

                <div className="absolute -inset-0.5 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-400/5 to-purple-500/5 dark:from-indigo-400/6 dark:to-purple-500/6"></div>
                </div>
            </article>

            {previewOpen && previewResource && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-label="File preview"
                >
                    <div
                        className="absolute inset-0 bg-black/70"
                        onClick={() => {
                            setPreviewOpen(false);
                            setPreviewResource(null);
                        }}
                    />

                    <div className="relative w-[92%] md:w-3/4 lg:w-2/3 h-[86%] bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xl z-[1001]">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="text-sm font-medium truncate text-white">{previewResource.originalName || previewResource.url || "Preview"}</div>
                            <button
                                onClick={() => {
                                    setPreviewOpen(false);
                                    setPreviewResource(null);
                                }}
                                className="p-2 rounded text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                aria-label="Close preview"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="w-full h-[calc(100%-48px)] bg-black">
                            {isYoutubeLike(previewResource.url || previewResource.link) ? (
                                <ExternalVideo url={previewResource.url || previewResource.link} />
                            ) : isVideoResource(previewResource) || isPdfResource(previewResource) ? (
                                <PlayerPanel
                                    sub={{
                                        title: previewResource.originalName || previewResource.url,
                                        supportMaterials: [previewResource],
                                        timeDuration: previewResource.timeDuration || 0,
                                    }}
                                    course={null}
                                    token={token}
                                    overrideResource={previewResource}
                                />
                            ) : (
                                <ResourceViewer resource={previewResource} course={null} token={token} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
