import { useState } from "react";
import { toast } from "react-hot-toast";
import Input from "@/shared/components/ui/Input";
import Textarea from "@/shared/components/ui/Textarea";
import Button from "@/shared/components/ui/Button";
import { createClassroomAPI } from "@/entities/classroom/model/classroomAPI";

export default function CreateModal({ onClose, onCreated, token }) {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!title?.trim()) {
            toast.error("Title is required");
            return;
        }
        setSubmitting(true);
        try {
            await createClassroomAPI({ title: title.trim(), description: desc || "" }, token);
            toast.success("Classroom created");
            onCreated && onCreated();
        } catch (err) {
            console.error("CreateModal error", err);
            toast.error(err?.message || "Failed to create classroom");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/30 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-richblack-900">Create Classroom</h4>
                    <button onClick={onClose} className="text-gray-600">Close</button>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Classroom title"
                        className="mt-2"
                    />

                    <Textarea
                        label="Description"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Short description"
                        rows={4}
                        className="mt-2"
                    />

                    <div className="flex justify-end items-center gap-3 mt-4">
                        <Button variant="light" onClick={onClose} className="px-4 py-2">
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={submitting || !title} className="px-4 py-2">
                            {submitting ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
