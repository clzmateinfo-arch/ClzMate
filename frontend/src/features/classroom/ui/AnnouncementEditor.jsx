import { useState } from "react";
import { motion } from "framer-motion";
import IconBtn from "@/shared/components/ui/IconBtn";
import { FiX } from "react-icons/fi";

export default function AnnouncementEditor({ onClose = () => { }, onCreate = () => { }, defaultClassroomId = null, disabled = false }) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [pinned, setPinned] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) return alert("Title is required");
        setSaving(true);
        try {
            await onCreate({ title: title.trim(), body: body.trim(), pinned: !!pinned, classroom: defaultClassroomId });
        } catch (err) {
            console.error("Announcement create failed", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !saving && onClose()} />
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="relative w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl"
            >
                <button onClick={() => !saving && onClose()} className="absolute top-4 right-4 text-slate-500">
                    <FiX size={18} />
                </button>

                <h3 className="text-lg font-semibold text-slate-800">New announcement</h3>

                <div className="mt-4 space-y-3">
                    <div>
                        <label className="text-xs text-slate-600">Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 p-3 border-gray-50 rounded" placeholder="Short title" />
                    </div>

                    <div>
                        <label className="text-xs text-slate-600">Body</label>
                        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="w-full mt-1 p-3 border-gray-50 rounded" placeholder="Write the announcement..." />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} disabled={disabled || saving} className="border-amber-100" />
                            <span className="text-sm text-slate-600">Pin this announcement</span>
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4">
                        <button onClick={() => onClose()} disabled={saving} className="px-4 py-2 rounded text-sm border-grey-100">
                            Cancel
                        </button>
                        <IconBtn text={saving ? "Saving..." : "Publish"} onClick={handleSubmit} className="bg-indigo-600 text-white" disabled={disabled || saving} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
