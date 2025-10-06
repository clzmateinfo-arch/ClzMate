import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiChevronRight, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { getQuizAPI } from "@/entities/classroom/model/classroomAPI";
import IconBtn from "@/shared/components/ui/IconBtn";
import { toast } from "react-hot-toast";

/**
 * QuizPlayer — Full screen quiz presentation
 *
 * Behavior:
 *  - Landing slide -> when Start clicked begins run
 *  - Each screen: render UI by template (multiple/truefalse/short/slider/poll/puzzle)
 *  - Per-screen timer (screen.properties.timeLimit seconds)
 *  - On submit or time expiry: reveal answers, show incremental scoreboard, move next
 *  - Final slide: leaderboard & student place
 *
 * Notes:
 *  - Uses getQuizAPI(quizId, token) to fetch quiz metadata + screens
 *  - Saves attempt locally (no server attempt API required). If you add a server endpoint later,
 *    you can call it with the `attempt` object emitted in onFinish
 */

const PAGE_TRANSITION = { type: "spring", stiffness: 280, damping: 30 };

function useInterval(callback, delay) {
    const savedRef = useRef();
    useEffect(() => { savedRef.current = callback; }, [callback]);
    useEffect(() => {
        if (delay === null) return;
        const id = setInterval(() => savedRef.current(), delay);
        return () => clearInterval(id);
    }, [delay]);
}

export default function QuizPlayer({ token = null }) {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stage, setStage] = useState("landing"); // landing | running | results
    const [index, setIndex] = useState(0); // screen index when running
    const [answers, setAnswers] = useState([]); // [{screenId, answer, correct, points, timeTaken}]
    const [running, setRunning] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [screenState, setScreenState] = useState("question"); // question | reveal | scoreboard
    const [totalPoints, setTotalPoints] = useState(0);
    const [animating, setAnimating] = useState(false);

    // fetch quiz
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const q = await getQuizAPI(quizId, token);
                if (mounted) {
                    // sort screens by position
                    const screens = (q.screens || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));
                    setQuiz({ ...q, screens });
                }
            } catch (err) {
                console.error("Quiz load failed", err);
                toast.error("Failed to load quiz");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [quizId, token]);

    const currentScreen = useMemo(() => {
        if (!quiz || !Array.isArray(quiz.screens)) return null;
        return quiz.screens[index] || null;
    }, [quiz, index]);

    // Timer tick
    useInterval(() => {
        if (!running || !currentScreen) return;
        setRemaining((r) => {
            const next = Math.max(0, r - 0.25);
            if (next <= 0) {
                // time up
                onTimeUp();
            }
            return next;
        });
    }, running ? 250 : null);

    // compute total possible points (for progress)
    const totalPossible = useMemo(() => (quiz?.screens || []).reduce((s, sc) => s + ((sc.properties?.points) || 0), 0), [quiz]);

    // --- scoring helper ---
    function scoreAnswer(screen, provided) {
        const props = screen.properties || {};
        const base = Number(props.points || 0) || 0;
        const timeLimit = Number(props.timeLimit || 0) || 0;
        const timeTaken = Math.max(0, (timeLimit - (remaining || 0)));
        const answerMode = props.answerMode || "single";
        let correct = false;

        if (screen.type === "multiple" || screen.type === "truefalse") {
            const correctSet = new Set((screen.options || []).map((o, i) => o.correct ? String(i) : null).filter(Boolean));
            // provided can be index for single, array of indices for multiple
            const providedSet = new Set(Array.isArray(provided) ? provided.map(String) : [String(provided)]);
            // correct if sets match for multiple (or single is in correct)
            if (answerMode === "multiple") {
                // require at least all correct selected and no incorrect - simple equality
                const correctIds = (screen.options || []).map((o, i) => o.correct ? String(i) : null).filter(Boolean);
                const providedIds = Array.from(providedSet);
                correct = providedIds.length > 0 && providedIds.length === correctIds.length && providedIds.every(id => correctIds.includes(id));
            } else {
                // single
                correct = Array.from(correctSet).includes(String(provided));
            }
        } else if (screen.type === "short") {
            const expected = (screen.options || []).map(o => (o.text || "").trim().toLowerCase()).filter(Boolean);
            const resp = (provided || "").toString().trim().toLowerCase();
            correct = expected.length === 0 ? false : expected.includes(resp);
        } else if (screen.type === "slider") {
            // check nearest option (options maybe used as accepted value) -> if no options assume always correct and score proportionally to closeness
            const target = (screen.options && screen.options[0] && Number(screen.options[0].value)) || null;
            const val = Number(provided);
            if (target === null || isNaN(target)) {
                correct = true;
            } else {
                const diff = Math.abs(val - target);
                correct = diff === 0;
            }
        } else if (screen.type === "poll") {
            // polls usually not scored
            correct = false;
        } else {
            correct = false;
        }

        // time bonus: fraction of remaining time (only if timeLimit>0) -> up to 50% extra
        const timeBonus = timeLimit > 0 ? Math.round(base * ((Math.max(0, timeLimit - timeTaken) / timeLimit) * 0.5)) : 0;
        const pointsEarned = correct ? base + timeBonus : 0;
        return { correct, pointsEarned, base, timeTaken, timeBonus };
    }

    // when Start clicked
    const onStart = () => {
        if (!quiz) return;
        setStage("running");
        setIndex(0);
        setAnswers([]);
        setTotalPoints(0);
        setTimeout(() => startScreen(0), 250);
    };

    // begin a screen timer and reset state
    function startScreen(i) {
        const sc = quiz.screens[i];
        const t = Number(sc?.properties?.timeLimit || 0);
        setScreenState("question");
        setRemaining(t);
        setRunning(t > 0);
    }

    const onTimeUp = async () => {
        if (screenState !== "question") return;
        setRunning(false);
        setScreenState("reveal");
        // auto compute score with whatever current answer (if any)
        // find user's tentative answer for this screen
        const existing = answers.find(a => String(a.screenId) === String(currentScreen._id));
        const provided = existing ? existing.answer : (currentScreen.type === "multiple" ? [] : (currentScreen.type === "slider" ? currentScreen.properties?.default : ""));
        const { correct, pointsEarned, base, timeTaken, timeBonus } = scoreAnswer(currentScreen, provided);
        recordAnswer({ screenId: currentScreen._id, provided, correct, pointsEarned, base, timeTaken, timeBonus });
        // show reveal for 2s, then scoreboard for 1.5s, then next
        await delay(2000);
        setScreenState("scoreboard");
        await delay(1500);
        goNext();
    };

    function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

    function recordAnswer({ screenId, provided, correct, pointsEarned, base, timeTaken, timeBonus }) {
        setAnswers(prev => {
            const copy = [...prev.filter(p => String(p.screenId) !== String(screenId))];
            const entry = { screenId, answer: provided, correct, points: pointsEarned, basePoints: base, timeTaken, timeBonus };
            return [...copy, entry];
        });
        setTotalPoints(prev => prev + (pointsEarned || 0));
    }

    // user-submitted answer (manual click)
    const submitAnswer = async (provided) => {
        if (!currentScreen) return;
        if (screenState !== "question") return;
        setRunning(false);
        const { correct, pointsEarned, base, timeTaken, timeBonus } = scoreAnswer(currentScreen, provided);
        recordAnswer({ screenId: currentScreen._id, provided, correct, pointsEarned, base, timeTaken, timeBonus });
        // reveal answers briefly
        setScreenState("reveal");
        await delay(1200);
        setScreenState("scoreboard");
        await delay(1200);
        goNext();
    };

    function goNext() {
        setScreenState("question");
        const next = index + 1;
        if (!quiz || next >= (quiz.screens || []).length) {
            // finished
            setStage("results");
            setRunning(false);
            setRemaining(0);
            return;
        }
        setIndex(next);
        startScreen(next);
    }

    // UI rendering helpers: different templates
    const OptionButton = ({ idx, text, selected, disabled, onClick }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full text-left p-3 rounded-xl border shadow-sm transition ${selected ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-800/60 border-neutral-200"} hover:shadow-md`}
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-sm font-semibold">{idx + 1}</div>
                <div className="flex-1 text-sm">{text}</div>
            </div>
        </button>
    );

    // generate a deterministic mock leaderboard (if server not available)
    function buildLeaderboard(finalScore) {
        const seed = (quizId || "seed").split("").reduce((s, c) => s + c.charCodeAt(0), 0);
        const rnd = (n) => Math.abs(Math.sin(n + seed) * 10000) % 1;
        const competitors = 4;
        const others = Array.from({ length: competitors }).map((_, i) => {
            const sc = Math.max(0, Math.round((rnd(i + 1) * totalPossible)));
            return { id: `u${i + 1}`, name: `Player ${i + 1}`, score: sc };
        });
        const all = [...others, { id: "you", name: "You", score: finalScore }];
        all.sort((a, b) => b.score - a.score);
        return all.map((p, idx) => ({ ...p, rank: idx + 1 }));
    }

    // ---------- Render ----------
    if (loading) {
        return (
            <div className="w-full h-[80vh] flex items-center justify-center">
                <div>Loading quiz…</div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="w-full h-[80vh] flex flex-col gap-3 items-center justify-center">
                <div className="text-lg font-semibold">Quiz not found</div>
                <IconBtn text="Back" onClick={() => navigate(-1)} />
            </div>
        );
    }

    // Landing UI
    if (stage === "landing") {
        return (
            <div className="fixed inset-0 z-[1000] bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-3xl w-full rounded-2xl bg-white/10 backdrop-blur-md p-8 shadow-2xl"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-2xl font-bold">{quiz.title} <span className="ml-2">🎮</span></div>
                            <div className="text-sm mt-2 text-white/90">{quiz.description}</div>
                            <div className="mt-4 flex items-center gap-3 text-sm">
                                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                                    <FiClock /> {quiz.timeLimit ? `${quiz.timeLimit} min total` : "No total time"}
                                </div>
                                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                                    <span className="font-semibold">{quiz.screens?.length ?? 0}</span> screens
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <IconBtn text="Start quiz 🚀" onClick={onStart} className="px-4 py-2 bg-white/90 text-black" />
                            <button className="text-xs underline text-white/90" onClick={() => navigate(-1)}>Back</button>
                        </div>
                    </div>

                    <div className="mt-6 text-xs text-white/80">
                        Tip: You will see each question one-by-one. Answers are revealed after each question and points are shown.
                    </div>
                </motion.div>
            </div>
        );
    }

    // Final results
    if (stage === "results") {
        const finalScore = totalPoints;
        const board = buildLeaderboard(finalScore);

        return (
            <div className="fixed inset-0 z-[1000] bg-gradient-to-br from-slate-50 to-white p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl p-6 bg-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold">Quiz complete 🎉</div>
                                <div className="text-sm text-slate-500 mt-1">{quiz.title}</div>
                            </div>

                            <div className="text-right">
                                <div className="text-xs text-slate-400">Your score</div>
                                <div className="text-3xl font-extrabold">{finalScore}</div>
                                <div className="text-xs text-slate-500">{totalPossible ? `of ${totalPossible}` : ""}</div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl p-4 bg-white/50 border">
                                <div className="text-sm font-semibold mb-2">Summary</div>
                                <div className="space-y-2">
                                    {answers.map((a, i) => {
                                        const sc = quiz.screens.find(s => String(s._id) === String(a.screenId)) || {};
                                        return (
                                            <div key={i} className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium">{sc.body}</div>
                                                    <div className="text-xs text-slate-500">{a.correct ? "Correct ✅" : "Wrong ❌"}</div>
                                                </div>
                                                <div className="text-sm font-semibold">{a.points} pts</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-xl p-4 bg-white/50 border">
                                <div className="text-sm font-semibold mb-2">Leaderboard</div>
                                <div className="space-y-2">
                                    {board.map((p) => (
                                        <div key={p.id} className={`flex items-center justify-between p-2 rounded-md ${p.id === "you" ? "bg-indigo-50 border-indigo-200" : "bg-white/70 border"}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold">{p.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                                                <div>
                                                    <div className="text-sm font-medium">{p.name}{p.id === "you" ? " (You)" : ""}</div>
                                                    <div className="text-xs text-slate-500">Place #{p.rank}</div>
                                                </div>
                                            </div>
                                            <div className="text-lg font-bold">{p.score}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <IconBtn text="Close" onClick={() => navigate(-1)} className="bg-white text-black" />
                            <IconBtn text="Retake" onClick={() => { setStage("landing"); setIndex(0); setAnswers([]); setTotalPoints(0); }} className="bg-indigo-600 text-white" />
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Running state: render current screen
    if (stage === "running" && currentScreen) {
        const props = currentScreen.properties || {};
        const tl = Number(props.timeLimit || 0);

        // get any current answer user may have given
        const existing = answers.find(a => String(a.screenId) === String(currentScreen._id));

        // handlers per template:
        const onSelectOption = (idx) => {
            if (screenState !== "question") return;
            if (props.answerMode === "multiple") {
                // toggle index in array
                let arr = existing?.answer ? Array.isArray(existing.answer) ? [...existing.answer] : [existing.answer] : [];
                const sidx = arr.findIndex(v => String(v) === String(idx));
                if (sidx === -1) arr.push(String(idx)); else arr.splice(sidx, 1);
                setAnswers(prev => {
                    const copy = prev.filter(p => String(p.screenId) !== String(currentScreen._id));
                    return [...copy, { screenId: currentScreen._id, answer: arr }];
                });
            } else {
                setAnswers(prev => {
                    const copy = prev.filter(p => String(p.screenId) !== String(currentScreen._id));
                    return [...copy, { screenId: currentScreen._id, answer: String(idx) }];
                });
            }
            // if single mode, auto-submit quickly
            if (props.answerMode !== "multiple") {
                setTimeout(() => submitAnswer(String(idx)), 300);
            }
        };

        const onSubmitShort = (val) => {
            if (!val) return;
            submitAnswer(val);
        };

        const onSubmitSlider = (val) => submitAnswer(val);

        // percent time for progress bar
        const percent = tl > 0 ? Math.max(0, Math.min(100, Math.round((remaining / tl) * 100))) : 100;

        return (
            <div className="fixed inset-0 z-[1100] bg-gradient-to-br from-indigo-50 to-white p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <button onClick={() => { if (confirm("Quit quiz? Your progress will be lost.")) navigate(-1); }} className="text-sm underline">Quit</button>
                        </div>
                        <div className="text-sm text-slate-600">Screen {index + 1} / {quiz.screens?.length}</div>
                        <div className="text-right">
                            <div className="text-xs text-slate-400">Score</div>
                            <div className="text-lg font-semibold">{totalPoints}</div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentScreen._id + "-" + screenState}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={PAGE_TRANSITION}
                            className="mt-6 rounded-2xl p-6 bg-white shadow-lg"
                        >
                            {/* header: timer + question */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="text-lg font-semibold">{currentScreen.body}</div>
                                    <div className="text-xs text-slate-500 mt-1">{currentScreen.type} • {props.points || 0} pts</div>
                                </div>

                                <div className="w-40">
                                    <div className="text-xs text-slate-500">Time left</div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1">
                                            <div className="h-2 bg-slate-100 rounded-lg overflow-hidden">
                                                <div style={{ width: `${percent}%` }} className={`h-2 rounded-lg ${percent > 30 ? "bg-emerald-500" : "bg-rose-500"}`}></div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-mono w-14 text-right">{tl ? `${Math.ceil(remaining)}s` : "—"}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4">
                                {/* QUESTION UI */}
                                {currentScreen.type === "multiple" && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {(currentScreen.options || []).map((opt, i) => {
                                            const selected = Array.isArray(existing?.answer) ? existing.answer.map(String).includes(String(i)) : String(existing?.answer) === String(i);
                                            const disabled = screenState !== "question";
                                            // reveal correct style when in reveal state
                                            const showCorrect = screenState !== "question" && !!opt.correct;
                                            return (
                                                <motion.div key={i} layout>
                                                    <OptionButton
                                                        idx={i}
                                                        text={opt.text}
                                                        selected={selected || showCorrect}
                                                        disabled={disabled}
                                                        onClick={() => onSelectOption(i)}
                                                    />
                                                </motion.div>
                                            );
                                        })}
                                        {props.answerMode === "multiple" && (
                                            <div className="flex justify-end gap-2 mt-2">
                                                <IconBtn text="Submit answer" onClick={() => submitAnswer(existing?.answer || [])} className="bg-indigo-600 text-white" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {currentScreen.type === "truefalse" && (
                                    <div className="flex items-center gap-3">
                                        {(currentScreen.options || [{ text: "True" }, { text: "False" }]).map((o, idx) => {
                                            const label = o.text || (idx === 0 ? "True" : "False");
                                            const selected = String(existing?.answer) === String(idx);
                                            return (
                                                <button key={idx} onClick={() => onSelectOption(idx)} disabled={screenState !== "question"} className={`px-6 py-3 rounded-xl shadow ${selected ? "bg-emerald-600 text-white" : "bg-white border"}`}>
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {currentScreen.type === "short" && (
                                    <ShortAnswerBox initial={existing?.answer || ""} disabled={screenState !== "question"} onSubmit={onSubmitShort} />
                                )}

                                {currentScreen.type === "slider" && (
                                    <SliderBox screen={currentScreen} value={existing?.answer} disabled={screenState !== "question"} onSubmit={onSubmitSlider} />
                                )}

                                {currentScreen.type === "poll" && (
                                    <div className="space-y-2">
                                        {(currentScreen.options || []).map((opt, i) => (
                                            <button key={i} onClick={() => onSelectOption(i)} disabled={screenState !== "question"} className="w-full p-3 rounded-lg bg-white border">
                                                {opt.text}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* reveal overlay */}
                            {screenState !== "question" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mt-6 p-4 rounded-lg bg-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl">{answers.find(a => String(a.screenId) === String(currentScreen._id))?.correct ? "✅" : "❌"}</div>
                                        <div>
                                            <div className="text-sm font-semibold">{answers.find(a => String(a.screenId) === String(currentScreen._id))?.correct ? "Correct" : "Incorrect"}</div>
                                            <div className="text-xs text-slate-500">Points: {answers.find(a => String(a.screenId) === String(currentScreen._id))?.points}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-xs text-slate-500">Press <strong>Quit</strong> to exit</div>
                        <div className="flex items-center gap-2">
                            <div className="text-xs text-slate-400">Progress</div>
                            <div className="w-48 h-2 bg-slate-100 rounded overflow-hidden">
                                <div style={{ width: `${Math.round(((index) / (quiz.screens?.length || 1)) * 100)}%` }} className="h-2 bg-indigo-500"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // fallback
    return null;
}


/* ---------- UI helper components ---------- */

function ShortAnswerBox({ initial = "", disabled = false, onSubmit }) {
    const [val, setVal] = useState(initial || "");
    useEffect(() => setVal(initial || ""), [initial]);
    return (
        <div className="space-y-2">
            <textarea value={val} onChange={(e) => setVal(e.target.value)} disabled={disabled} className="w-full p-3 border rounded-lg" rows={3} />
            <div className="flex justify-end">
                <IconBtn text="Submit" onClick={() => onSubmit(val)} className="bg-indigo-600 text-white" disabled={disabled} />
            </div>
        </div>
    );
}

function SliderBox({ screen, value, disabled = false, onSubmit }) {
    const props = screen.properties || {};
    const min = Number(props.min ?? 0);
    const max = Number(props.max ?? 100);
    const step = Number(props.step ?? 1);
    const [v, setV] = useState(value ?? props.default ?? min);
    useEffect(() => { setV(value ?? props.default ?? min); }, [value, screen]);
    return (
        <div className="space-y-3">
            <div className="px-3 py-2 bg-white rounded-lg">
                <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => setV(Number(e.target.value))} disabled={disabled} />
                <div className="text-sm mt-2">Value: <strong>{v}</strong></div>
            </div>
            <div className="flex justify-end">
                <IconBtn text="Submit" onClick={() => onSubmit(v)} className="bg-indigo-600 text-white" disabled={disabled} />
            </div>
        </div>
    );
}
