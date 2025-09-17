// src/features/course/ui/NotesEditor.jsx
import React, { useEffect, useRef, useState } from "react";
import { apiConnector } from "@/shared/services/api/apiConnector"; // adapt as needed
import { useSelector } from "react-redux";

/**
 * NotesEditor
 * - lectureId: id of the lecture
 * - autosave after 2s idle (debounce)
 * - shows Saved indicator
 */
export default function NotesEditor({ lectureId }) {
    const { token } = useSelector((s) => s.auth || {});
    const [text, setText] = useState("");
    const [status, setStatus] = useState("idle"); // idle | saving | saved | error
    const timerRef = useRef(null);
    const lastSavedRef = useRef(0);

    useEffect(() => {
        // load existing note
        (async () => {
            if (!lectureId) { setText(""); return; }
            try {
                const res = await apiConnector("GET", `/api/notes/${lectureId}`, null, { Authorization: token ? `Bearer ${token}` : undefined });
                if (res?.data?.success && res?.data?.note) setText(res.data.note.text || "");
            } catch (e) {
                console.warn("Failed load note", e);
            }
        })();
    }, [lectureId, token]);

    // autosave logic: 2s after user stops typing
    useEffect(() => {
        if (!lectureId) return;
        setStatus("idle");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            setStatus("saving");
            try {
                await apiConnector("POST", `/api/notes/save`, { lectureId, text }, { Authorization: token ? `Bearer ${token}` : undefined });
                setStatus("saved");
                lastSavedRef.current = Date.now();
                setTimeout(() => {
                    setStatus("idle");
                }, 1500);
            } catch (e) {
                console.error("notes save failed", e);
                setStatus("error");
            }
        }, 2000);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [text, lectureId, token]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Notes</h4>
                <div className="text-xs text-gray-500">
                    {status === "saving" && <span>Saving...</span>}
                    {status === "saved" && <span className="text-emerald-500">Saved ✓</span>}
                    {status === "error" && <span className="text-red-500">Save failed</span>}
                </div>
            </div>

            <textarea
                className="w-full h-full p-3 rounded border border-white/8 bg-white/6 focus:outline-none resize-none"
                placeholder="Write notes... (auto-saves after 2s)"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>
    );
}
