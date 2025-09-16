import { useState, useEffect, useRef } from "react";
import { FiUploadCloud } from "react-icons/fi";

export default function MultiUpload({ name, label, register, setValue, errors, viewData = null, editData = null, allowedTypes = undefined }) {
    const [files, setFiles] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        register(name, { required: false });
    }, [register, name]);

    useEffect(() => {
        if (viewData || editData) {
            setFiles(viewData ?? editData ?? []);
            setValue(name, viewData ?? editData ?? []);
        }
    }, [viewData, editData]);

    const handleAdd = (e) => {
        const added = Array.from(e.target.files || []);
        const merged = [...files, ...added];
        setFiles(merged);
        setValue(name, merged);
    };

    const removeAt = (idx) => {
        const next = [...files];
        next.splice(idx, 1);
        setFiles(next);
        setValue(name, next);
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
                    <label className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold bg-amber-400/90 border border-white/8 text-[#0b1220]">
                        Add files
                        <input {...allowedAttr} type="file" multiple onChange={handleAdd} className="hidden" ref={inputRef} />
                    </label>
                </div>

                <div className="mt-3 space-y-2">
                    {files.length === 0 ? (
                        <p className="text-xs text-gray-500">No support files added.</p>
                    ) : (
                        files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between rounded-md bg-white/5 p-2">
                                <div className="truncate text-sm">{f.name ?? f}</div>
                                <button type="button" onClick={() => removeAt(i)} className="text-sm text-red-600">Remove</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {errors?.[name] && <p className="mt-1 text-sm text-red-600">Support files invalid</p>}
        </div>
    );
}