import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { fetchNote, saveNote } from "@/entities/course/model/courseDetailsAPI";

export default function NotePanel({ courseId, sectionId, subSectionId, userId }) {
    const key = `notes:${userId || "anon"}:${courseId}:${sectionId}:${subSectionId}`;
    const token = useSelector((s) => s.auth?.token);
    const [text, setText] = useState("");
    const [status, setStatus] = useState("Saved");
    const timer = useRef(null);
    const idleDelay = 2000;

    useEffect(() => {
        let mounted = true;
        setStatus("Loading");
        const doLoad = async () => {
            if (token) {
                const res = await fetchNote({ courseId, sectionId, subSectionId }, token);
                if (!mounted) return;
                if (res?.success && res.data) {
                    setText(res.data.content || "");
                    setStatus("Saved");
                } else {
                    const existing = localStorage.getItem(key);
                    if (existing) setText(existing);
                    setStatus("Saved");
                }
            } else {
                const existing = localStorage.getItem(key);
                if (existing) setText(existing);
                setStatus("Saved");
            }
        };
        doLoad();
        return () => { mounted = false; if (timer.current) clearTimeout(timer.current); };
    }, [courseId, sectionId, subSectionId, token, key]);

    const doSave = async (value) => {
        try {
            setStatus("Saving");
            localStorage.setItem(key, value);
            if (token) {
                const payload = { courseId, sectionId, subSectionId, content: value };
                const res = await saveNote(payload, token);
                if (res?.success) {
                    setStatus("Saved");
                } else {
                    setStatus("Saved (local)");
                }
            } else {
                setStatus("Saved (local)");
            }
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
        <div className="h-full overflow-y-auto sidebar-scroll bg-slate-800/40 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium">Personal Notes</h4>
                <div className="text-xs text-slate-400">
                    {status === "Saving" ? "Saving..." : status}
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
