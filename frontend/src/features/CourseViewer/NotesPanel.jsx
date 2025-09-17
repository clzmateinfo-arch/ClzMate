// src/features/courseViewer/NotesPanel.jsx
import React, { useEffect, useRef, useState } from "react";

export default function NotesPanel({ courseId, sectionId, subSectionId, userId }) {
    const key = `notes:${userId || "anon"}:${courseId}:${sectionId}:${subSectionId}`;
    const [text, setText] = useState("");
    const [status, setStatus] = useState("Saved"); // Saved | Saving | Error | Unsaved
    const timer = useRef(null);
    const idleDelay = 2000; // 2s

    useEffect(() => {
        // load
        const existing = localStorage.getItem(key);
        if (existing) setText(existing);
        setStatus("Saved");
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, [key]);

    const doSave = async (value) => {
        try {
            setStatus("Saving");
            localStorage.setItem(key, value);
            // OPTIONAL: call API to persist notes to server
            // await apiConnector("POST", "/api/notes/save", {courseId, sectionId, subSectionId, userId, text: value});
            setStatus("Saved");
        } catch (e) {
            console.error(e);
            setStatus("Error");
        }
    };

    const onChange = (v) => {
        setText(v);
        setStatus("Unsaved");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => doSave(v), idleDelay);
    };

    return (
        <div className="bg-slate-800/40 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium">Personal Notes</h4>
                <div className="text-xs text-slate-400">{status === "Saving" ? "Saving..." : status === "Saved" ? "Saved" : status}</div>
            </div>

            <textarea
                value={text}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-3 min-h-[160px] resize-y rounded bg-transparent border border-slate-700 p-3 text-sm text-slate-100 focus:outline-none"
                placeholder="Write notes here... autosaves after 2s idle"
            />
        </div>
    );
}
