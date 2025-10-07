import React, { useState } from "react";
import { toast } from "react-hot-toast";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";
import { joinClassroomByCodeAPI } from "@/entities/classroom/model/classroomAPI";

export default function JoinModal({ onClose, onJoined, token }) {
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleJoin = async () => {
        if (!code?.trim()) {
            toast.error("Invite code required");
            return;
        }
        setSubmitting(true);
        try {
            await joinClassroomByCodeAPI({ inviteCode: code.trim(), role: "Guest" }, token);
            toast.success("Joined classroom");
            onJoined && onJoined();
        } catch (err) {
            console.error("JoinModal error", err);
            toast.error(err?.message || "Failed to join classroom");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-richblack-900">Join Classroom</h4>
                    <button onClick={onClose} className="text-gray-600">Close</button>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Invite Code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter invite code"
                    />

                    <div className="flex justify-end items-center gap-3 mt-4">
                        <Button variant="light" onClick={onClose} className="px-4 py-2">Cancel</Button>
                        <Button onClick={handleJoin} disabled={submitting || !code} className="px-4 py-2">
                            {submitting ? "Joining..." : "Join"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
