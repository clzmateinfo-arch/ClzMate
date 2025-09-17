// MultiUpload.jsx
import { useState, useEffect, useRef } from "react";
import { FiUploadCloud } from "react-icons/fi";

/**
 * MultiUpload
 * - Maintains three buckets: existing (server objects), newFiles (File[]), remove (publicIds to delete)
 * - Keeps form value as: { existing: [...], new: [...], remove: [...] } via setValue(name, value)
 *
 * Props:
 *  - name, label, register, setValue, errors
 *  - viewData/editData: array of server-side objects or simple url strings
 *  - allowedTypes: optional accept attr for <input>
 */
export default function MultiUpload({
    name,
    label,
    register,
    setValue,
    errors,
    viewData = null,
    editData = null,
    allowedTypes = undefined,
}) {
    const [existing, setExisting] = useState([]); // server items: { url, publicId, originalName, ... }
    const [newFiles, setNewFiles] = useState([]); // File objects selected in browser
    const [removeIds, setRemoveIds] = useState([]); // publicId or url to remove on submit
    const inputRef = useRef(null);

    useEffect(() => {
        // register the field (it will be an object)
        register(name, { required: false });
        // initialize form value
        setValue(name, { existing: [], new: [], remove: [] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [register, name]);

    useEffect(() => {
        // normalize incoming existing data (from server) to objects with expected props
        const incoming = viewData ?? editData ?? [];
        if (!incoming) {
            setExisting([]);
            setValue(name, { existing: [], new: [], remove: [] });
            return;
        }

        const normalized =
            Array.isArray(incoming) && incoming.length
                ? incoming.map((it) => {
                    // if it's already our shape, keep; if it's a string (url), derive file name
                    if (!it) return null;
                    if (typeof it === "object") {
                        return {
                            url: it.url ?? it.pdfUrl ?? it.videoUrl ?? null,
                            publicId: it.publicId ?? it.pdfPublicId ?? it.videoPublicId ?? it._id ?? null,
                            originalName:
                                it.originalName ??
                                it.name ??
                                (it.url ? it.url.split("/").pop() : "file"),
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
        // update form value
        setValue(name, { existing: normalized, new: newFiles, remove: removeIds });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewData, editData]);

    useEffect(() => {
        // sync whenever newFiles/removeIds/existing changes
        setValue(name, { existing, new: newFiles, remove: removeIds });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existing, newFiles, removeIds]);

    const handleAdd = (e) => {
        const added = Array.from(e.target.files || []);
        if (!added.length) return;
        const merged = [...newFiles, ...added];
        setNewFiles(merged);
        // setValue happens via effect
        // clear native input so same file can be re-added later if needed
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
        // if the removed item has a publicId or url, mark it for deletion
        if (removed?.publicId) setRemoveIds((r) => [...r, removed.publicId]);
        else if (removed?.url) setRemoveIds((r) => [...r, removed.url]);
    };

    const allowedAttr = allowedTypes ? { accept: allowedTypes } : {};

    return (
        <div className="flex flex-col space-y-2">
            <label className="block text-sm font-semibold text-[#0b1220]">{label}</label>

            <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FiUploadCloud className="w-6 h-6 text-[#7C3AED]" />
                        <p className="text-sm">Upload support materials (multiple files allowed)</p>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold bg-amber-400/90 border border-white/8 text-[#0b1220] cursor-pointer">
                        Add files
                        <input {...allowedAttr} type="file" multiple onChange={handleAdd} className="hidden" ref={inputRef} />
                    </label>
                </div>

                <div className="mt-3 space-y-2">
                    {/* existing server items */}
                    {existing.length > 0 && (
                        <>
                            <div className="text-xs text-gray-500 mb-2">Existing files</div>
                            {existing.map((f, i) => (
                                <div key={f.publicId ?? f.url ?? `${i}-existing`} className="flex items-center justify-between rounded-md bg-white/5 p-2">
                                    <div className="truncate text-sm">
                                        {f.url ? (
                                            <a href={f.url} target="_blank" rel="noreferrer" className="underline">
                                                {f.originalName}
                                            </a>
                                        ) : (
                                            <span>{f.originalName}</span>
                                        )}
                                        <div className="text-xs text-gray-400">{f.mimeType ?? ""}</div>
                                    </div>
                                    <button type="button" onClick={() => removeExistingAt(i)} className="text-sm text-red-600">Remove</button>
                                </div>
                            ))}
                        </>
                    )}

                    {/* newly added files (local) */}
                    {newFiles.length > 0 && (
                        <>
                            <div className="text-xs text-gray-500 mb-2">Files to upload</div>
                            {newFiles.map((f, i) => (
                                <div key={`${f.name}-${i}`} className="flex items-center justify-between rounded-md bg-white/5 p-2">
                                    <div className="truncate text-sm">{f.name}</div>
                                    <button type="button" onClick={() => removeNewAt(i)} className="text-sm text-red-600">Remove</button>
                                </div>
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
