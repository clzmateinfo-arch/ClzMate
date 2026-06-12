import React, { useEffect, useState } from "react";
import { FiX, FiDownload } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getSignedAssetUrl } from "@/entities/course/model/courseDetailsAPI";
import ResourceViewer from "@/shared/components/app/ResourceViewer";
import PlayerPanel from "@/shared/components/app/PlayerPanel";
import ExternalVideo from "@/shared/components/app/ExternalVideo";
import HtmlViewer from "@/shared/components/app/HtmlViewer";

export default function SupportFilesPanel({ supportMaterials = [], token = null }) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewResource, setPreviewResource] = useState(null);
    const [previewSub, setPreviewSub] = useState(null); // stable object passed to PlayerPanel
    const [downloadingId, setDownloadingId] = useState(null);

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
                setPreviewSub(null);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [previewOpen]);

    const openPreview = (m) => {
        if (!m) return;
        setPreviewResource(m);

        // Create a stable previewSub once (avoid inline object recreation causing re-renders)
        const stableSub = {
            _previewMarker: m._id || m.publicId || m.url || Date.now(),
            title: m.originalName || m.url || "Preview",
            supportMaterials: [m],
            timeDuration: m.timeDuration || 0,
        };
        setPreviewSub(stableSub);

        setPreviewOpen(true);
    };

    const closePreview = () => {
        setPreviewOpen(false);
        setPreviewResource(null);
        setPreviewSub(null);
    };

    const downloadHtmlFile = async (m) => {
        const fileId = m._id || m.publicId || m.url;
        setDownloadingId(fileId);
        try {
            let url = m.url;
            if (m.publicId) {
                const signed = await getSignedAssetUrl(
                    { publicId: m.publicId, resourceType: m.resourceType || "raw", type: "authenticated" },
                    token
                );
                url = typeof signed === "string" ? signed : signed?.url ?? m.url;
            }
            if (!url) throw new Error("No URL available for download");
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`Failed to fetch file (${resp.status})`);
            const text = await resp.text();
            const blob = new Blob([text], { type: "text/html" });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = m.originalName || "download.html";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("HTML download error", err);
            toast.error("Could not download file");
        } finally {
            setDownloadingId(null);
        }
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

    const isHtmlResource = (r = {}) =>
        !!r.isMainHtml ||
        mt(r).includes("html") ||
        (name(r) || "").endsWith(".html") ||
        (name(r) || "").endsWith(".htm");

    if (!Array.isArray(supportMaterials) || supportMaterials.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
                No support files available for this lecture.
            </div>
        );
    }

    return (
        <>
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
                                <button
                                    onClick={() => openPreview(m)}
                                    className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                                    title="View"
                                >
                                    View
                                </button>
                                {isHtmlResource(m) && (
                                    <button
                                        onClick={() => downloadHtmlFile(m)}
                                        disabled={downloadingId === (m._id || m.publicId || m.url)}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm disabled:opacity-50 transition-colors"
                                        title="Download HTML file"
                                        type="button"
                                    >
                                        <FiDownload className="w-3.5 h-3.5" />
                                        {downloadingId === (m._id || m.publicId || m.url) ? "..." : "Download"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {previewOpen && previewResource && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Support file preview"
                >
                    <div
                        className="absolute inset-0 bg-black/70"
                        onClick={closePreview}
                    />

                    <div className="relative w-[92%] md:w-3/4 lg:w-2/3 h-[86%] bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xl z-[1001]">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="text-sm font-medium truncate">{previewResource.originalName || previewResource.url || "Preview"}</div>
                            <button
                                onClick={closePreview}
                                className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                aria-label="Close preview"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="w-full h-[calc(100%-48px)] bg-black">
                            {isYoutubeLike(previewResource.url || previewResource.link) ? (
                                <ExternalVideo url={previewResource.url || previewResource.link} />
                            ) : isHtmlResource(previewResource) ? (
                                <HtmlViewer resource={previewResource} token={token} />
                            ) : (previewSub && (isVideoResource(previewResource) || isPdfResource(previewResource))) ? (
                                <PlayerPanel
                                    sub={previewSub}
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
