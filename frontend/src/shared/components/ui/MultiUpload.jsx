import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiUploadCloud } from "react-icons/fi";
import { showToast } from "@/shared/components/feedback/CustomToast";

export default function MultiUpload({
    name,
    label,
    register,
    setValue,
    errors,
    viewData = null,
    editData = null,
    allowedTypes = undefined,
    disabled = false,
}) {
    const [existing, setExisting] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [removeIds, setRemoveIds] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        register(name, { required: false });
        setValue(name, { existing: [], new: [], remove: [] });
    }, [register, name]);

    useEffect(() => {
        const incoming = viewData ?? editData ?? [];
        if (!incoming) {
            setExisting([]);
            setValue(name, { existing: [], new: [], remove: [] });
            return;
        }

        const normalized =
            Array.isArray(incoming) && incoming.length
                ? incoming.map((it) => {
                    if (!it) return null;
                    if (typeof it === "object") {
                        return {
                            url: it.url ?? it.pdfUrl ?? it.videoUrl ?? null,
                            publicId: it.publicId ?? it.pdfPublicId ?? it.videoPublicId ?? it._id ?? null,
                            originalName:
                                it.originalName ?? it.name ?? (it.url ? it.url.split("/").pop() : "file"),
                            mimeType: it.mimeType ?? null,
                            size: it.size ?? null,
                            _id: it._id ?? null,
                        };
                    } else if (typeof it === "string") {
                        return {
                            url: it,
                            publicId: null,
                            originalName: it.split("/").pop(),
                            mimeType: null,
                            size: null,
                            _id: null,
                        };
                    }
                    return null;
                }).filter(Boolean)
                : [];

        setExisting(normalized);
        setValue(name, { existing: normalized, new: newFiles, remove: removeIds });
    }, [viewData, editData]);

    useEffect(() => {
        setValue(name, { existing, new: newFiles, remove: removeIds });
    }, [existing, newFiles, removeIds]);

    const defaultAllowed = "image/*,video/*,application/pdf,.zip";
    const acceptAttr = allowedTypes ?? defaultAllowed;

    const isAllowed = (file) => {
        if (!file) return false;
        const mime = (file.type || "").toLowerCase();
        const name = (file.name || "").toLowerCase();
        const ext = name.includes(".") ? name.substring(name.lastIndexOf(".")) : "";

        if (mime.startsWith("image/")) return true;
        if (mime.startsWith("video/")) return true;
        if (mime === "application/pdf" || ext === ".pdf") return true;
        if (ext === ".zip" || mime === "application/zip") return true;
        if (mime.includes("html") || ext === ".html" || ext === ".htm") return true;
        return false;
    };

    const handleAdd = (e) => {
        const added = Array.from(e.target.files || []);
        if (!added.length) return;

        const allowed = added.filter(isAllowed);
        const rejected = added.length - allowed.length;
        if (rejected > 0) {
            showToast("Some files were rejected — only images, videos, PDF, ZIP and HTML files are allowed.", "error");
        }

        if (!allowed.length) return;

        const merged = [...newFiles, ...allowed];
        setNewFiles(merged);
        if (inputRef.current) inputRef.current.value = "";
    };

    const removeNewAt = (idx) => {
        const next = [...newFiles];
        next.splice(idx, 1);
        setNewFiles(next);
    };

    const removeExistingAt = (idx) => {
        const next = [...existing];
        const removed = next.splice(idx, 1)[0];
        setExisting(next);
        if (removed?.publicId) setRemoveIds((r) => [...r, removed.publicId]);
        else if (removed?.url) setRemoveIds((r) => [...r, removed.url]);
    };

    return (
        <div className="flex flex-col space-y-2">
            <label className="block text-sm font-semibold text-[#0b1220]">{label}</label>

            <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FiUploadCloud className="w-6 h-6 text-[#7C3AED]" />
                        <p className="text-sm">Upload support materials (multiple files allowed)</p>
                    </div>
                    {disabled ? (<label className="inline-flex items-center text-center gap-2 rounded-full px-3 py-2 text-sm font-semibold bg-amber-400/90 border border-white/8 text-[#0b1220] cursor-pointer">
                        Add files
                        <input accept={acceptAttr} type="file" multiple onChange={handleAdd} className="hidden" ref={inputRef} />
                    </label>
                    ) : (<></>)}
                </div>

                <div className="mt-3 space-y-2">
                    {existing.length > 0 && (
                        <>
                            <div className="text-xs text-gray-500 mb-2">Existing files</div>
                            {existing.map((f, i) => (
                                <div key={f.publicId ?? f.url ?? `${i}-existing`} className="flex items-center justify-between rounded-md bg-white/5 p-2">
                                    <div className="truncate text-sm">
                                        {f.url ? (
                                            <Link to={f.url} target="_blank" rel="noreferrer" className="underline">
                                                {f.originalName}
                                            </Link>
                                        ) : (
                                            <span>{f.originalName}</span>
                                        )}
                                        <div className="text-xs text-gray-400">{f.mimeType ?? ""}</div>
                                    </div>
                                    {disabled ? (
                                        <button type="button" onClick={() => removeExistingAt(i)} className="text-sm text-red-600">Remove</button>
                                    ) : (<></>)}
                                </div>
                            ))}
                        </>
                    )}

                    {newFiles.length > 0 && (
                        <>
                            <div className="text-xs text-gray-500 mb-2">Files to upload</div>
                            {newFiles.map((f, i) => (
                                disabled ? (<div key={`${f.name}-${i}`} className="flex items-center justify-between rounded-md bg-white/5 p-2">
                                    <div className="truncate text-sm">{f.name}</div>
                                    <button type="button" onClick={() => removeNewAt(i)} className="text-sm text-red-600">Remove</button>
                                </div>
                                ) : (<></>)
                            ))}
                        </>
                    )}

                    {existing.length === 0 && newFiles.length === 0 && (
                        <p className="text-xs text-gray-500">No support files added.</p>
                    )}
                </div>
            </div>

            {errors?.[name] && <p className="mt-1 text-sm text-red-600">Support files invalid</p>}
        </div>
    );
}
