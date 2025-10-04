import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setQuiz, setStepQuiz } from "@/entities/classroom/model/quizSlice";
import {
    createScreenAPI,
    updateScreenAPI,
    reorderScreensAPI,
    getQuizAPI,
    updateQuizAPI,
    deleteScreenAPI,
} from "@/entities/classroom/model/quizAPI";
import Button from "@/shared/components/ui/Button";
import FieldsetRadio from "@/shared/components/ui/FieldsetRadio";
import { toast } from "react-hot-toast";
import { FiPlus, FiTrash2, FiEdit, FiMove } from "react-icons/fi";

const TEMPLATES = [
    { value: "multiple", label: "Multiple Choice" },
    { value: "truefalse", label: "True / False" },
    { value: "short", label: "Short Answer" },
    { value: "slider", label: "Slider" },
    { value: "poll", label: "Poll" },
    { value: "puzzle", label: "Puzzle" },
];

function ScreenPreview({ screen }) {
    if (!screen) return null;
    const { type, body = "", options = [] } = screen;
    return (
        <div className="rounded-lg border p-4 bg-white">
            <div className="text-sm font-medium mb-2">Preview</div>
            <div className="text-sm font-semibold mb-2">{body || "Question text"}</div>
            <div className="space-y-2">
                {type === "multiple" &&
                    (options || []).map((o, i) => (
                        <div key={i} className="text-sm">
                            <span className="inline-block w-4">{String.fromCharCode(65 + i)}.</span> {o.text}
                        </div>
                    ))}
                {type === "truefalse" && (
                    <div className="flex gap-2">
                        <div className="px-3 py-1 border rounded">True</div>
                        <div className="px-3 py-1 border rounded">False</div>
                    </div>
                )}
                {type === "short" && <div className="border rounded p-2 text-sm text-slate-500">Short text answer</div>}
                {type === "slider" && <div className="border rounded p-2 text-sm text-slate-500">Slider control</div>}
                {type === "poll" && <div className="text-sm">Poll (no correct answer)</div>}
                {type === "puzzle" && <div className="text-sm">Puzzle</div>}
            </div>
        </div>
    );
}

function ScreenEditor({ screen, onChange }) {
    const [local, setLocal] = useState(screen || { type: "multiple", body: "", options: [], properties: { timeLimit: 0, points: 1, answerMode: "single" } });

    useEffect(() => setLocal(screen || { type: "multiple", body: "", options: [], properties: { timeLimit: 0, points: 1, answerMode: "single" } }), [screen]);

    const update = (patch) => {
        const nx = { ...local, ...patch };
        setLocal(nx);
        onChange && onChange(nx);
    };

    const updateOption = (idx, patch) => {
        const opts = [...(local.options || [])];
        opts[idx] = { ...opts[idx], ...patch };
        update({ options: opts });
    };

    const addOption = () => {
        update({ options: [...(local.options || []), { text: "New option", correct: false }] });
    };

    const removeOption = (idx) => {
        const opts = [...(local.options || [])];
        opts.splice(idx, 1);
        update({ options: opts });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium">Template</label>
                <div className="mt-2">
                    <FieldsetRadio
                        name="type"
                        options={TEMPLATES}
                        value={local.type}
                        onChange={(v) => update({ type: v })}
                        orientation="row"
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium">Question text</label>
                <textarea className="w-full mt-2 p-2 border rounded" value={local.body || ""} onChange={(e) => update({ body: e.target.value })} rows={3} />
            </div>

            {(local.type === "multiple" || local.type === "poll") && (
                <div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Options</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={addOption} className="px-2 py-1 rounded border">Add</button>
                        </div>
                    </div>
                    <div className="mt-2 space-y-2">
                        {(local.options || []).map((o, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <input type={local.properties?.answerMode === "multiple" ? "checkbox" : "radio"} checked={!!o.correct} onChange={(e) => updateOption(i, { correct: e.target.checked })} />
                                <input value={o.text} onChange={(e) => updateOption(i, { text: e.target.value })} className="flex-1 p-2 border rounded" />
                                <button type="button" onClick={() => removeOption(i)} className="text-red-500 p-2"><FiTrash2 /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {local.type === "truefalse" && (
                <div className="space-y-2">
                    <div className="text-sm">Select which is correct</div>
                    <div className="flex gap-3 mt-2">
                        <button type="button" onClick={() => update({ options: [{ text: "True", correct: true }, { text: "False", correct: false }] })} className="px-3 py-1 border rounded">Mark True</button>
                        <button type="button" onClick={() => update({ options: [{ text: "True", correct: false }, { text: "False", correct: true }] })} className="px-3 py-1 border rounded">Mark False</button>
                    </div>
                </div>
            )}

            <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2">Properties</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs">Time limit (s)</label>
                        <input type="number" value={local.properties?.timeLimit ?? 0} onChange={(e) => update({ properties: { ...(local.properties || {}), timeLimit: Number(e.target.value) } })} className="w-full p-2 border rounded" />
                    </div>

                    <div>
                        <label className="text-xs">Points</label>
                        <input type="number" value={local.properties?.points ?? 1} onChange={(e) => update({ properties: { ...(local.properties || {}), points: Number(e.target.value) } })} className="w-full p-2 border rounded" />
                    </div>

                    <div>
                        <label className="text-xs">Answer mode</label>
                        <select value={local.properties?.answerMode || "single"} onChange={(e) => update({ properties: { ...(local.properties || {}), answerMode: e.target.value } })} className="w-full p-2 border rounded">
                            <option value="single">Single</option>
                            <option value="multiple">Multiple</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function QuizBuilder({ topicId, overview }) {
    const dispatch = useDispatch();
    const { token } = useSelector((s) => s.auth || {});
    const { quiz } = useSelector((s) => s.quiz || {});
    const [screens, setScreens] = useState(quiz?.screens || []);
    const [activeId, setActiveId] = useState(null);
    const [saving, setSaving] = useState(false);
    const dragRef = useRef({ draggingId: null });

    useEffect(() => {
        setScreens(quiz?.screens ? [...quiz.screens].sort((a, b) => (a.position || 0) - (b.position || 0)) : []);
        if (quiz && (!quiz.screens || quiz.screens.length === 0)) {
            setActiveId(null);
        } else if (quiz && quiz.screens.length > 0) {
            setActiveId(quiz.screens[0]._id || quiz.screens[0].id);
        }
    }, [quiz]);

    const addScreen = async (template) => {
        if (!quiz || !quiz._id) {
            toast.error("Save quiz info first");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                type: template,
                body: "",
                options: template === "truefalse" ? [{ text: "True", correct: false }, { text: "False", correct: false }] : [],
                properties: { timeLimit: 0, points: 1, answerMode: "single" },
            };
            const created = await createScreenAPI(quiz._id, payload, token);
            setScreens((s) => [...s, created]);
            setActiveId(created._id || created.id);
            dispatch(setQuiz({ ...quiz, screens: [...(quiz.screens || []), created] }));
            toast.success("Screen added");
        } catch (err) {
            console.error("addScreen", err);
            toast.error("Failed to add screen");
        } finally {
            setSaving(false);
        }
    };

    const updateScreen = async (id, payload) => {
        setSaving(true);
        try {
            const updated = await updateScreenAPI(id, payload, token);
            setScreens((s) => s.map((x) => (String(x._id || x.id) === String(updated._id || updated.id) ? updated : x)));
            dispatch(setQuiz({ ...quiz, screens: (quiz.screens || []).map((x) => (String(x._id || x.id) === String(updated._id || updated.id) ? updated : x)) }));
            toast.success("Screen saved");
        } catch (err) {
            console.error("updateScreen", err);
            toast.error("Failed to save screen");
        } finally {
            setSaving(false);
        }
    };

    const removeScreen = async (id) => {
        if (!confirm("Delete this screen?")) return;
        try {
            await deleteScreenAPI(quiz._id, id, token);
            const remaining = screens.filter((s) => String(s._id || s.id) !== String(id));
            setScreens(remaining);
            dispatch(setQuiz({ ...quiz, screens: remaining }));
            setActiveId(remaining[0]?._id || null);
            toast.success("Deleted");
        } catch (err) {
            console.error("removeScreen", err);
            toast.error("Delete failed");
        }
    };

    const onDragStart = (e, id) => {
        e.dataTransfer.setData("text/plain", id);
        dragRef.current.draggingId = id;
    };

    const onDrop = async (e, targetId) => {
        e.preventDefault();
        const draggingId = dragRef.current.draggingId || e.dataTransfer.getData("text/plain");
        if (!draggingId || draggingId === targetId) return;
        const arr = [...screens];
        const fromIdx = arr.findIndex((t) => String(t._id || t.id) === String(draggingId));
        const toIdx = arr.findIndex((t) => String(t._id || t.id) === String(targetId));
        if (fromIdx === -1 || toIdx === -1) return;
        const [item] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, item);
        setScreens(arr);
        try {
            await reorderScreensAPI(quiz._id, arr.map((it) => it._id || it.id), token);
            dispatch(setQuiz({ ...quiz, screens: arr }));
            toast.success("Reordered");
        } catch (err) {
            console.error("reorderScreens", err);
            toast.error("Persist reorder failed");
        }
    };

    const onDragOver = (e) => e.preventDefault();

    const activeScreen = useMemo(() => screens.find((s) => String(s._id || s.id) === String(activeId)), [screens, activeId]);

    const saveQuizMetadata = async (payload) => {
        if (!quiz || !quiz._id) return;
        setSaving(true);
        try {
            const updated = await updateQuizAPI(quiz._id, payload, token);
            dispatch(setQuiz(updated));
            toast.success("Saved");
        } catch (err) {
            console.error("saveQuizMetadata", err);
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    if (!quiz) return <div className="text-sm text-slate-500">Save quiz information first to start building screens.</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                <div className="rounded-md border p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium">Screens</div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <select onChange={(e) => addScreen(e.target.value)} className="p-2 border rounded">
                                    <option value="">Add screen...</option>
                                    {TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <button type="button" onClick={() => { setScreens([]); dispatch(setQuiz({ ...quiz, screens: [] })); }} className="px-2 py-1 border rounded text-xs">Clear</button>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
                        {screens.map((s) => {
                            const sid = s._id || s.id;
                            return (
                                <div key={sid} draggable onDragStart={(e) => onDragStart(e, sid)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, sid)} className={`p-2 rounded border flex items-center justify-between gap-2 ${String(activeId) === String(sid) ? "bg-violet-50 border-violet-200" : ""}`}>
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveId(sid)}>
                                        <div className="text-sm font-medium truncate">{s.body ? s.body.slice(0, 40) : `Screen ${screens.indexOf(s) + 1}`}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button type="button" title="Edit" onClick={() => setActiveId(sid)} className="p-1"><FiEdit /></button>
                                        <button type="button" title="Delete" onClick={() => removeScreen(sid)} className="p-1 text-red-500"><FiTrash2 /></button>
                                        <div className="p-1"><FiMove /></div>
                                    </div>
                                </div>
                            );
                        })}
                        {screens.length === 0 && <div className="text-sm text-slate-500">No screens yet</div>}
                    </div>
                </div>

                <div className="rounded-md border p-4 bg-white">
                    <div className="text-sm font-medium mb-2">Quiz Controls</div>
                    <div className="flex gap-2">
                        <Button variant="light" onClick={() => dispatch(setStepQuiz(1))} className="bg-white text-black">Back</Button>
                        <Button onClick={() => dispatch(setStepQuiz(3))} disabled={screens.length === 0}>Review & Publish</Button>
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-4">
                <div className="rounded-md border p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm font-medium mb-2">Editor</div>
                            <ScreenEditor key={activeScreen?._id || activeScreen?.id} screen={activeScreen} onChange={(s) => { if (!activeScreen) return; updateScreen(activeScreen._id || activeScreen.id, s); }} />
                            <div className="flex gap-2 mt-3">
                                <Button variant="light" onClick={() => { if (!activeScreen) return; updateScreen(activeScreen._id || activeScreen.id, activeScreen); }} className="bg-white text-black">Save Screen</Button>
                                <Button onClick={() => { if (!activeScreen) return; updateScreen(activeScreen._id || activeScreen.id, { status: (activeScreen.status === "published" ? "draft" : "published") }); }}>{activeScreen?.status === "published" ? "Unpublish" : "Publish"}</Button>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-2">Preview & Properties</div>
                            <ScreenPreview screen={activeScreen} />
                            <div className="mt-3">
                                <div className="text-sm font-medium mb-2">Quiz-level Save</div>
                                <div className="flex gap-2">
                                    <Button variant="light" onClick={() => saveQuizMetadata({})} className="bg-white text-black">Save</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border p-4 bg-white">
                    <div className="text-sm font-medium mb-2">Notes</div>
                    <div className="text-sm text-slate-500">You can rearrange screens by dragging. Each screen has independent time/points and answer mode.</div>
                </div>
            </div>
        </div>
    );
}
