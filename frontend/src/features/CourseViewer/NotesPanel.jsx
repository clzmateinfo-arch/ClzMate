import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { fetchNote, saveNote } from "@/entities/course/model/courseDetailsAPI";

export default function NotesPanel({ courseId, sectionId, subSectionId, userId }) {
    const auth = useSelector((s) => s.auth || {});
    const token = auth?.token || null;

    const key = `notes:${userId || "anon"}:${courseId}:${sectionId}:${subSectionId}`;

    const [text, setText] = useState("");
    const [status, setStatus] = useState("Saved");
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const timer = useRef(null);
    const idleDelay = 2000; // 2s
    const mounted = useRef(true);
    const pendingSaveId = useRef(0);

    useEffect(() => {
        mounted.current = true;
        (async () => {
            setStatus("Saving");
            try {
                if (token) {
                    const resp = await fetchNote({ courseId, sectionId, subSectionId }, token);
                    if (resp?.success && resp.data) {
                        setText(resp.data.content ?? "");
                        setStatus("Saved");
                        setLastSavedAt(resp.data.updatedAt || resp.data.createdAt || null);
                        try { localStorage.setItem(key, resp.data.content ?? ""); } catch (e) { }
                        return;
                    }
                }
            } catch (e) {
                console.warn("fetch note failed", e);
            }
            try {
                const existing = localStorage.getItem(key);
                if (existing) setText(existing);
            } catch (e) { }
            setStatus("Saved");
        })();

        return () => {
            mounted.current = false;
            if (timer.current) clearTimeout(timer.current);
        };
    }, [courseId, sectionId, subSectionId, token, userId]);

    const doSaveToServer = async (value, saveId) => {
        try {
            setStatus("Saving");
            try { localStorage.setItem(key, value); } catch (e) { }
            if (!token) {
                setStatus("Saved");
                setLastSavedAt(new Date().toISOString());
                return { success: false, message: "No token" };
            }
            const payload = { courseId, sectionId, subSectionId, content: value };
            const resp = await saveNote(payload, token);
            if (!resp || !resp.success) {
                throw new Error(resp?.message || "Failed to save note");
            }
            setStatus("Saved");
            setLastSavedAt(resp.data?.updatedAt || new Date().toISOString());
            return resp;
        } catch (err) {
            console.error("Save note failed", err);
            setStatus("Error");
            return { success: false, error: err };
        } finally {
            console.log("notes saved successfully");
        }
    };

    const scheduleSave = (value) => {
        pendingSaveId.current += 1;
        const thisSaveId = pendingSaveId.current;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            await doSaveToServer(value, thisSaveId);
        }, idleDelay);
    };

    const onChange = (v) => {
        setText(v);
        setStatus("Unsaved");
        scheduleSave(v);
    };

    const handleManualSave = async () => {
        if (timer.current) clearTimeout(timer.current);
        await doSaveToServer(text, ++pendingSaveId.current);
    };

    const handleDiscard = async () => {
        if (token) {
            try {
                setStatus("Saving");
                const resp = await fetchNote({ courseId, sectionId, subSectionId }, token);
                if (resp?.success && resp.data) {
                    setText(resp.data.content ?? "");
                    setStatus("Saved");
                    setLastSavedAt(resp.data.updatedAt || resp.data.createdAt || null);
                    try { localStorage.setItem(key, resp.data.content ?? ""); } catch (e) { }
                    return;
                }
            } catch (e) {
                console.warn("discard -> fetch failed", e);
            }
        }
        try {
            const existing = localStorage.getItem(key) ?? "";
            setText(existing);
        } catch (e) { }
        setStatus("Saved");
    };

    return (
        <div className="bg-slate-800/40 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium">Personal Notes</h4>
                <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400">
                        {status === "Saving" ? "Saving..." : status === "Saved" ? `Saved${lastSavedAt ? ` • ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}` : status}
                    </div>
                    <button onClick={handleManualSave} className="px-2 py-1 rounded bg-gradient-to-tr from-[#ba7bf0] to-[#5046e4] text-white text-sm">Save</button>
                    <button onClick={handleDiscard} className="px-2 py-1 rounded bg-slate-700 text-sm">Discard</button>
                </div>
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
