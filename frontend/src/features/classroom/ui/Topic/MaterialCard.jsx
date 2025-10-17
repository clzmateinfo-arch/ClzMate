// frontend/src/features/classroom/ui/Topic/MaterialCard.jsx
import React, { useState, useRef, useEffect } from "react";
import {
    FiCopy,
    FiTrash2,
    FiEdit,
    FiX,
    FiCheck,
    FiDownload,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
    FiUpload,
} from "react-icons/fi";
import { updateItemAPI } from "@/entities/classroom/model/classroomAPI";
import { toast } from "react-hot-toast";
import IconBtn from "@/shared/components/ui/IconBtn";

const CHIP_SIZE = 60;

function getMimeTypeFromName(name = "") {
    const ext = (name || "").split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
    if (["mp4", "webm", "ogg"].includes(ext)) return "video";
    if (["pdf"].includes(ext)) return "pdf";
    return "other";
}

function AttachmentChip({ att, onPreview, removable = false, removed = false, onToggleRemove }) {
    const name = att.originalName || att.name || (att.url && att.url.split("/").pop()) || "file";
    const mimeKind = (att.mimeType || "").split("/")[0] || getMimeTypeFromName(name);
    const sizeStyle = { width: `${CHIP_SIZE}px`, height: `${CHIP_SIZE}px`, minWidth: `${CHIP_SIZE}px` };

    return (
        <div
            className={`relative group rounded-lg mx-1 bg-white/95 overflow-hidden shadow-sm`}
            style={sizeStyle}
            role="group"
            tabIndex={0}
            aria-label={name}
        >
            <div className="w-full h-full flex flex-col justify-between">
                <div className="flex items-center justify-center flex-1">
                    <div className="w-12 h-12 rounded-md flex items-center justify-center bg-gradient-to-r from-[#f3f0ff] to-[#eef2ff] text-[#6b4dff] font-semibold text-sm">
                        {mimeKind === "image" ? "🖼" : mimeKind === "video" ? "▶" : mimeKind === "pdf" ? "📄" : "📎"}
                    </div>
                </div>
            </div>

            <div
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 flex items-center justify-center"
                aria-hidden={!removed}
            >
                <div className="flex items-center gap-2">




                    {removable ? (
                        <>
                            <a
                                href={att.url || att.previewUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                                download={name}
                                className="p-1 rounded hover:shadow-md text-white"
                                title="Download"
                                onClick={(e) => {
                                    if (!att.url && !att.previewUrl) {
                                        e.preventDefault();
                                        toast("No downloadable URL available");
                                    }
                                }}
                            >
                                <FiDownload className="w-4 h-4" />
                            </a>
                            <button
                                type="button"
                                onClick={() => onToggleRemove && onToggleRemove(att)}
                                title={removed ? "Undo remove" : "Mark remove"}
                                className={`p-1 rounded ${removed ? "text-green-800 bg-white/50" : "text-white hover:shadow-md"}`}
                            >
                                {removed ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            aria-label={`Preview ${name}`}
                            onClick={() => onPreview && onPreview(att)}
                            className="p-1 rounded hover:shadow-md text-white"
                            title="Preview"
                        >
                            <FiEye className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function PreviewModal({ open, onClose, source }) {
    if (!open || !source) return null;
    const name = source.originalName || source.name || (source.url && source.url.split("/").pop()) || "file";
    const mime = source.mimeType || "";
    const kind = mime.split("/")[0] || getMimeTypeFromName(name);
    const srcUrl = source.previewUrl || source.url;

    return (
        <div className="fixed inset-0 z-[1200] grid place-items-center bg-black/60 p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-auto">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">{name}</h3>
                    <button onClick={onClose} className="p-2 rounded hover:bg-black/5">✕</button>
                </div>
                <div className="p-4 max-h-[70vh]">
                    {kind === "image" ? (
                        <img src={srcUrl} alt={name} className="w-full object-contain" />
                    ) : kind === "video" ? (
                        <video src={srcUrl} controls className="w-full" />
                    ) : kind === "pdf" ? (
                        <iframe src={srcUrl} title={name} className="w-full min-h-[600px]" />
                    ) : (
                        <div className="p-6 text-sm text-slate-600">
                            <p>No preview available. You can download the file to view it.</p>
                            <a href={srcUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline mt-3 inline-block">
                                Download / Open
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MaterialCard({
    item = {},
    topicId,
    token,
    onDelete,
    onCopy,
    onToggle,
    onUpdated,
    className = "",
}) {
    const [editing, setEditing] = useState(false);
    const [existing, setExisting] = useState(item.attachments?.slice() || []);
    const [toRemove, setToRemove] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedFilesPreview, setSelectedFilesPreview] = useState([]);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();
    const chipRowRef = useRef(null);
    const [previewSource, setPreviewSource] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        return () => {
            selectedFilesPreview.forEach((s) => {
                if (s.previewUrl && s.previewUrl.startsWith("blob:")) URL.revokeObjectURL(s.previewUrl);
            });
        };
    }, [selectedFilesPreview]);

    const normalizedExisting = existing.map((att) => ({
        ...att,
        previewUrl: att.url,
        __kind: "existing",
    }));

    const toggleRemoveExisting = (attOrIdx) => {
        const id = typeof attOrIdx === "number" ? attOrIdx : attOrIdx?.publicId || attOrIdx?.url || attOrIdx;
        setToRemove((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    };

    const defaultAllowed = "image/*,video/*,application/pdf,.zip";

    const isAllowed = (file) => {
        if (!file) return false;
        const mime = (file.type || "").toLowerCase();
        const name = (file.name || "").toLowerCase();
        const ext = name.includes(".") ? name.substring(name.lastIndexOf(".")) : "";
        if (mime.startsWith("image/")) return true;
        if (mime.startsWith("video/")) return true;
        if (mime === "application/pdf" || ext === ".pdf") return true;
        if (ext === ".zip" || mime === "application/zip") return true;
        return false;
    };

    const onFilesChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const allowed = files.filter(isAllowed);
        const rejected = files.length - allowed.length;
        if (rejected > 0) toast.error("Some files were rejected — only images, videos, PDF and ZIP files are allowed.");
        if (!allowed.length) return;
        const mapped = allowed.map((f) => ({ file: f, previewUrl: URL.createObjectURL(f), name: f.name, mimeType: f.type, __kind: "new" }));
        setSelectedFiles((prev) => [...prev, ...allowed]);
        setSelectedFilesPreview((prev) => [...prev, ...mapped]);
        e.target.value = "";
    };

    const removeSelectedLocal = (index) => {
        const removed = selectedFilesPreview[index];
        if (removed?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(removed.previewUrl);
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setSelectedFilesPreview((prev) => prev.filter((_, i) => i !== index));
    };

    const onSave = async () => {
        if (!topicId || !item._id) return toast.error("Missing item or topic info");
        const fd = new FormData();
        if (toRemove.length > 0) {
            const removeList = toRemove
                .map((idOrIdx) => {
                    if (typeof idOrIdx === "number") {
                        const att = existing[idOrIdx];
                        return att?.publicId || att?.url || att?.originalName || "";
                    }
                    return idOrIdx;
                })
                .filter(Boolean);
            fd.append("removeAttachments", JSON.stringify(removeList));
        }
        selectedFiles.forEach((f) => fd.append("attachments", f, f.name));

        try {
            setSaving(true);
            const updated = await updateItemAPI(topicId, item._id, fd, token, true);
            toast.success("Material updated");
            setEditing(false);
            selectedFilesPreview.forEach((s) => s.previewUrl?.startsWith("blob:") && URL.revokeObjectURL(s.previewUrl));
            setSelectedFiles([]);
            setSelectedFilesPreview([]);
            setToRemove([]);
            setExisting(updated.attachments || []);
            onUpdated && onUpdated(updated);
        } catch (err) {
            console.error("save material", err);
            toast.error(err?.message || "Failed to update material");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        selectedFilesPreview.forEach((s) => s.previewUrl?.startsWith("blob:") && URL.revokeObjectURL(s.previewUrl));
        setSelectedFiles([]);
        setSelectedFilesPreview([]);
        setToRemove([]);
        setExisting(item.attachments?.slice() || []);
    };

    const scrollBy = (dir = "right") => {
        const el = chipRowRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "right" ? el.clientWidth * 0.7 : -el.clientWidth * 0.7, behavior: "smooth" });
    };

    const openPreview = (att) => {
        const src = {
            previewUrl: att.previewUrl || null,
            url: att.url || null,
            mimeType: att.mimeType || att.type || "",
            originalName: att.originalName || att.name || (att.url && att.url.split("/").pop()) || "file",
        };
        setPreviewSource(src);
        setPreviewOpen(true);
    };

    const isPublished = Boolean(item.status === "published" || item.publish);

    return (
        <div className={`relative w-full min-h-[170px] sm:min-w-[20rem] rounded-lg border border-[#f3eff9]/70 bg-white px-4 py-4 transition hover:shadow-sm ${className}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 max-w-full">
                    <button onClick={() => scrollBy("left")} className="p-2 rounded bg-white/90 hover:shadow-sm hidden sm:inline-flex">
                        <FiChevronLeft />
                    </button>

                    <div ref={chipRowRef} className="flex gap-3 overflow-x-auto overflow-y-hidden    no-scrollbar py-1 px-1" style={{ height: `${CHIP_SIZE + 12}px`, minWidth: "160px", maxWidth: "36ch" }}>
                        {normalizedExisting.length > 0 &&
                            normalizedExisting.map((att, idx) => {
                                const removed = toRemove.includes(idx) || toRemove.includes(att.publicId) || toRemove.includes(att.url);
                                return (
                                    <div key={att.publicId || att.url || idx} className="flex-shrink-0">
                                        <AttachmentChip att={att} onPreview={openPreview} removable={editing} removed={removed} onToggleRemove={() => toggleRemoveExisting(idx)} />
                                    </div>
                                );
                            })}

                        {selectedFilesPreview.map((s, i) => (
                            <div key={s.previewUrl + i} className="flex-shrink-0">
                                <AttachmentChip att={s} onPreview={openPreview} removable={editing} removed={false} onToggleRemove={() => removeSelectedLocal(i)} />
                            </div>
                        ))}

                        {normalizedExisting.length === 0 && selectedFilesPreview.length === 0 && (
                            <div className="text-sm text-slate-500 flex items-center pl-2">No files attached.</div>
                        )}
                    </div>

                    <button onClick={() => scrollBy("right")} className="p-2 rounded bg-white/90 hover:shadow-sm hidden sm:inline-flex">
                        <FiChevronRight />
                    </button>
                </div>
            </div>

            {editing && (
                <div className="mt-3">
                    <label className="block text-sm font-semibold text-[#0b1220] mb-2">Attachments</label>

                    <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                        <div className="flex items-center justify-between m-1">
                            <div className="flex items-center gap-3">
                                <FiUpload className="w-6 h-6 text-[#7C3AED]" />
                                <p className="text-sm">Upload support materials (multiple files allowed)</p>
                            </div>

                            <label className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-amber-400/90 border border-white/8 text-[#0b1220] cursor-pointer">
                                +
                                <input ref={fileRef} accept={defaultAllowed} type="file" multiple onChange={onFilesChange} className="hidden" />
                            </label>
                        </div>

                        <div className="mt-3 space-y-2">
                            {/* {normalizedExisting.length > 0 && (
                                <>
                                    <div className="text-xs text-gray-500 mb-2">Existing files</div>
                                    <div className="flex flex-wrap gap-2">
                                        {normalizedExisting.map((f, i) => {
                                            const removed = toRemove.includes(i) || toRemove.includes(f.publicId) || toRemove.includes(f.url);
                                            return (
                                                <AttachmentChip key={f.publicId ?? f.url ?? `${i}-existing`} att={f} removable removed={removed} onPreview={openPreview} onToggleRemove={() => toggleRemoveExisting(i)} />
                                            );
                                        })}
                                    </div>
                                </>
                            )} */}

                            {selectedFilesPreview.length > 0 && (
                                <>
                                    <div className="text-xs text-gray-500 mb-2">Files to upload</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFilesPreview.map((f, i) => (
                                            <AttachmentChip key={`${f.name}-${i}`} att={f} removable removed={false} onPreview={openPreview} onToggleRemove={() => removeSelectedLocal(i)} />
                                        ))}
                                    </div>
                                </>
                            )}

                            {normalizedExisting.length === 0 && selectedFilesPreview.length === 0 && <p className="text-xs text-gray-500">No support files added</p>}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className={`text-xs px-2 py-0.5 rounded ${isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                        {isPublished ? "Published" : "Draft"}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {!editing && (
                        <button onClick={() => setEditing(true)} title="Edit" className="p-2 rounded hover:bg-black/5">
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

                    {editing && (
                        <>
                            <IconBtn
                                text={saving ? "Saving..." : "Save"}
                                onClick={onSave}
                                disabled={saving}
                                customClasses="!py-1 bg-violet-600 text-white hover:bg-violet-700"
                                textClass="text-white text-sm"
                            >
                                <FiCheck className="w-4 h-4" />
                            </IconBtn>
                        </>
                    )}
                </div>
            </div>

            <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} source={previewSource} />
        </div>
    );
}
