import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setQuiz, setStepQuiz } from "@/entities/classroom/model/classroomSlice";
import {
    createScreenAPI,
    updateScreenAPI,
    reorderScreensAPI,
    updateQuizAPI,
    deleteScreenAPI,
} from "@/entities/classroom/model/classroomAPI";
import Button from "@/shared/components/ui/Button";
import { toast } from "react-hot-toast";
import ScreenSection from "./components/ScreenSection";
import ScreenPreviewModal from "./components/ScreenPreviewModal.jsx";
import TemplateEditorRouter from "./components/TemplateEditorRouter";

const TEMPLATES = [
    { value: "multiple", label: "Multiple Choice" },
    { value: "truefalse", label: "True / False" },
    { value: "short", label: "Short Answer" },
    { value: "slider", label: "Slider" },
    { value: "poll", label: "Poll" },
];

export default function QuizBuilder({ _topicId, _overview }) {
    const dispatch = useDispatch();
    const { token } = useSelector((s) => s.auth || {});
    const { quiz } = useSelector((s) => s.classroom || {});
    const [screens, setScreens] = useState(quiz?.screens || []);
    const [activeId, setActiveId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const dragRef = useRef({ draggingId: null });

    const saveTimer = useRef(null);
    const [editorState, setEditorState] = useState(null);

    useEffect(() => {
        setScreens(
            quiz?.screens
                ? [...quiz.screens]
                : []
        );
        if (quiz && (!quiz.screens || quiz.screens.length === 0)) {
            setActiveId(null);
        } else if (quiz && quiz.screens.length > 0) {
            setActiveId(quiz.screens[0]._id || quiz.screens[0].id);
        }
    }, [quiz]);

    useEffect(() => {
        const active =
            screens.find((s) => String(s._id || s.id) === String(activeId)) || null;
        setEditorState(active);
    }, [activeId, screens]);

    useEffect(() => {
        return () => clearTimeout(saveTimer.current);
    }, []);

    const addScreen = async (template) => {
        if (!quiz || !quiz._id) {
            toast.error("Save quiz info first");
            return;
        }
        if (!template) return;
        setSaving(true);
        try {
            const payload = {
                type: template,
                body: "",
                options:
                    template === "truefalse"
                        ? [
                            { text: "True", correct: false },
                            { text: "False", correct: false },
                        ]
                        : [],
                properties: { timeLimit: 0, points: 1, answerMode: "single" },
            };
            const created = await createScreenAPI(quiz._id, payload, token);
            const next = [...screens, created];
            setScreens(next);
            setActiveId(created._id || created.id);
            setEditorState(created);
            dispatch(setQuiz({ ...quiz, screens: next }));
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
            const updatedScreens = screens.map((s) =>
                String(s._id || s.id) === String(updated._id || updated.id)
                    ? updated
                    : s
            );
            setScreens(updatedScreens);
            if (String(activeId) === String(updated._id || updated.id))
                setEditorState(updated);
            toast.success("Screen saved");
            return updated;
        } catch (err) {
            console.error("updateScreen", err);
            toast.error("Failed to save screen");
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const removeScreen = async (id) => {
        if (!confirm("Delete this screen?")) return;
        try {
            await deleteScreenAPI(quiz._id, id, token);
            const remaining = screens.filter(
                (s) => String(s._id || s.id) !== String(id)
            );
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
        const draggingId =
            dragRef.current.draggingId || e.dataTransfer.getData("text/plain");
        if (!draggingId || draggingId === targetId) return;
        const arr = [...screens];
        const fromIdx = arr.findIndex(
            (t) => String(t._id || t.id) === String(draggingId)
        );
        const toIdx = arr.findIndex((t) => String(t._id || t.id) === String(targetId));
        if (fromIdx === -1 || toIdx === -1) return;
        const [item] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, item);
        setScreens(arr);
        try {
            await reorderScreensAPI(
                quiz._id,
                arr.map((it) => it._id || it.id),
                token
            );
            dispatch(setQuiz({ ...quiz, screens: arr }));
            toast.success("Reordered");
        } catch (err) {
            console.error("reorderScreens", err);
            toast.error("Persist reorder failed");
        }
    };

    const onDragOver = (e) => e.preventDefault();

    const activeScreen = useMemo(
        () => screens.find((s) => String(s._id || s.id) === String(activeId)),
        [screens, activeId]
    );

    const onEditorChange = (s) => {
        setEditorState(s);
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            if (!s || !activeId) return;
            updateScreen(activeId, s).catch(() => { });
        }, 6000);
    };

    const saveAndNext = async (payload) => {
        if (!quiz || !quiz._id) return;
        setSaving(true);
        try {
            const updated = await updateQuizAPI(quiz._id, payload, token);
            dispatch(setQuiz(updated));
            toast.success("Quiz saved");
            dispatch(setStepQuiz(3));
        } catch (err) {
            console.error("saveQuizMetadata", err);
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    if (!quiz)
        return (
            <div className="text-sm text-slate-500">
                Save quiz information first to start building screens.
            </div>
        );

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-4">
                    <div className="rounded-xl border-neutral-300 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-semibold">Screens</div>
                            <div className="relative">
                                <select
                                    onChange={(e) => {
                                        addScreen(e.target.value);
                                        e.target.value = "";
                                    }}
                                    className="appearance-none p-2 pr-8 border border-neutral-300 rounded-lg bg-white text-sm shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">➕ Add screen…</option>
                                    {TEMPLATES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-500">
                                    ▼
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[560px] overflow-auto pr-2">
                            {screens.map((s, idx) => {
                                const sid = s._id || s.id;
                                return (
                                    <ScreenSection
                                        key={sid}
                                        screen={s}
                                        index={idx}
                                        active={String(activeId) === String(sid)}
                                        onSelect={() => setActiveId(sid)}
                                        onDelete={() => removeScreen(sid)}
                                        onDragStart={(e) => onDragStart(e, sid)}
                                        onDrop={(e) => onDrop(e, sid)}
                                        onDragOver={onDragOver}
                                        onEdit={() => setActiveId(sid)}
                                    />
                                );
                            })}
                            {screens.length === 0 && (
                                <div className="text-sm text-slate-500 mt-2">
                                    No screens yet — add one to begin.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border-neutral-300 mt-4 bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold mb-2">Notes</div>
                        <div className="text-sm text-slate-500">
                            Drag screens on the left to reorder. Each screen has independent
                            properties and preview.
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="light"
                                onClick={() => dispatch(setStepQuiz(1))}
                                className="bg-white text-black"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={() => saveAndNext(quiz)}
                                disabled={screens.length === 0}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                    <div className="rounded-xl border-neutral-300 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-lg font-semibold">
                                    {editorState
                                        ? editorState.body ||
                                        `Screen ${screens.indexOf(editorState) + 1}`
                                        : "Editor"}
                                </div>
                                <div className="text-sm text-slate-500">
                                    Edit screen content and behavior here
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="light"
                                    onClick={() => setPreviewOpen(true)}
                                    disabled={!editorState}
                                    className="bg-white text-black"
                                >
                                    Preview
                                </Button>
                                <Button
                                    variant="light"
                                    onClick={() =>
                                        editorState && updateScreen(activeId, editorState)
                                    }
                                    className="bg-white text-black"
                                    disabled={!editorState || saving}
                                >
                                    {saving ? "Saving..." : "Save Screen"}
                                </Button>
                            </div>
                        </div>

                        <div>
                            {editorState ? (
                                <TemplateEditorRouter
                                    screen={editorState}
                                    onChange={onEditorChange}
                                    templates={TEMPLATES}
                                />
                            ) : (
                                <div className="text-sm text-slate-500">
                                    Select a screen from the left or add a new one to begin
                                    editing
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ScreenPreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                screen={editorState || activeScreen}
            />
        </>
    );
}
