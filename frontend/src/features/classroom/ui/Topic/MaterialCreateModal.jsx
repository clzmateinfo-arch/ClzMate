import React, { useEffect, useRef, useState } from "react";
import { createItemAPI, updateItemAPI } from "@/entities/classroom/model/classroomAPI";
import { toast } from "react-hot-toast";
import Input from "@/shared/components/ui/Input";
import Textarea from "@/shared/components/ui/Textarea";
import Button from "@/shared/components/ui/Button";
import IconBtn from "@/shared/components/ui/IconBtn";
import { FiUploadCloud, FiTrash2 } from "react-icons/fi";

export default function MaterialCreateModal({
    open = false,
    topicId,
    token,
    onClose = () => { },
    onCreated = () => { },
}) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [files, setFiles] = useState([]);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        if (open) {
            setTitle("");
            setContent("");
            setFiles([]);
            setSaving(false);
        }
    }, [open]);

    const handleFiles = (ev) => {
        const added = Array.from(ev.target.files || []);
        if (!added.length) return;
        setFiles((f) => [...f, ...added]);
        if (fileRef.current) fileRef.current.value = "";
    };

    const removeFileAt = (idx) => setFiles((f) => f.filter((_, i) => i !== idx));

    const close = () => {
        if (saving) return;
        onClose && onClose();
    };

    const handleSave = async (e) => {
        e && e.preventDefault();
        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }
        setSaving(true);
        try {
            const created = await createItemAPI(
                topicId,
                { type: "material", title: title.trim(), content: content || "" },
                token
            );

            if (!files || files.length === 0) {
                toast.success("Item created");
                onCreated && onCreated(created);
                close();
                return;
            }

            const fd = new FormData();
            files.forEach((f) => fd.append("attachments", f));
            fd.append("title", title.trim());
            if (content) fd.append("content", content);

            const updated = await updateItemAPI(topicId, created._id, fd, token, true);

            toast.success("Item created and files uploaded");
            onCreated && onCreated(updated || created);
            close();
        } catch (err) {
            console.error("create material modal error", err);
            toast.error(err?.response?.data?.message || err?.message || "Failed to create item");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div aria-modal="true" role="dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={close} />
            <form
                onSubmit={handleSave}
                className="relative w-full max-w-xl bg-white rounded-2xl p-6 shadow-sm z-10 border border-white/8"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Material</h3>
                    <button type="button" onClick={close} className="text-slate-500 hover:text-slate-800">✕</button>
                </header>

                <div className="space-y-4">
                    <div className=" mt-3 mb-1">
                        <Input
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter title"
                        />
                    </div>
                    <div className=" mt-3 mb-1">
                        <Textarea
                            label="Description"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Optional"
                            rows={4}
                        />
                    </div>
                    <div className="space-y-2 mt-3 mb-1">
                        <label className="block text-sm font-semibold text-[#0b1220]">Attachments (optional)</label>

                        <div className="rounded-xl border border-white/8 bg-white/6 p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 mt-3 mb-1">
                                <FiUploadCloud className="w-6 h-6 text-[#7C3AED]" />
                                <div className="text-sm text-slate-700">Upload support materials (images, video, pdf, zip)</div>
                            </div>

                            <div className="flex items-center gap-2 mt-3 mb-1">
                                <input ref={fileRef} type="file" multiple onChange={handleFiles} className="hidden" />
                                <Button variant="light" onClick={() => fileRef.current && fileRef.current.click()} className="px-4 py-2 text-sm">
                                    Add files
                                </Button>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {files.map((f, idx) => (
                                    <div key={`${f.name}-${idx}`} className="flex items-center justify-between rounded-md bg-white/5 p-2">
                                        <div className="truncate text-sm">{f.name}</div>
                                        <IconBtn onClick={() => removeFileAt(idx)} outline className="px-3 py-1" text="">
                                            <FiTrash2 />
                                        </IconBtn>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <footer className="mt-6 flex items-center justify-end gap-3">
                    <Button variant="light" onClick={close} className="bg-white text-black" disabled={saving}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Create"}
                    </Button>
                </footer>
            </form>
        </div>
    );
}
