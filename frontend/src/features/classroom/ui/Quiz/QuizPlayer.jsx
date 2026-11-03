import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { getQuizAPI, submitQuizAttemptAPI, getQuizLeaderboardAPI } from "@/entities/classroom/model/classroomAPI";
import IconBtn from "@/shared/components/ui/IconBtn";
import { showToast } from "@/shared/components/feedback/CustomToast";

import Landing from "./components/player/Landing";
import LeaderboardPanel from "./components/player/LeaderboardPanel";
import MultipleScreen from "./components/player/MultipleScreen";
import PollScreen from "./components/player/PollScreen";
import RevealPanel from "./components/player/RevealPanel";
import ShortAnswerScreen from "./components/player/ShortAnswerScreen";
import SliderScreen from "./components/player/SliderScreen";
import TrueFalseScreen from "./components/player/TrueFalseScreen";

const PAGE_TRANSITION = { type: "spring", stiffness: 280, damping: 30 };
const DEFAULT_SCREEN_TIME = 20;
const REVEAL_DURATION = 2500;
const SCOREBOARD_DURATION = 3500;

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

    // Quiz / UI state
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stage, setStage] = useState("landing"); // landing | running | results
    const [index, setIndex] = useState(0); // screen index when running
    const [answers, setAnswers] = useState([]); // [{screenId, answer, correct, points, timeTaken, basePoints, timeBonus}]
    const [running, setRunning] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [screenState, setScreenState] = useState("question"); // question | reveal | scoreboard
    const [totalPoints, setTotalPoints] = useState(0);
    const [currentTL, setCurrentTL] = useState(DEFAULT_SCREEN_TIME);

    // Leaderboard state (from server)
    const [leaderboard, setLeaderboard] = useState([]); // array of { id, name, score, rank }
    const isResolvingRef = useRef(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const q = await getQuizAPI(quizId, token);
                if (mounted) {
                    const screens = (q.screens || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));
                    setQuiz({ ...q, screens });
                }
            } catch (err) {
                showToast(err?.response?.data?.message || "Failed to load quiz", "error");
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

    // Timer tick (quarter-second granularity)
    useInterval(() => {
        if (!running || !currentScreen) return;
        setRemaining((r) => {
            const next = Math.max(0, r - 0.25);
            if (next <= 0) {
                onTimeUp();
            }
            return next;
        });
    }, running ? 250 : null);

    const totalPossible = useMemo(() => (quiz?.screens || []).reduce((s, sc) => s + ((sc.properties?.points) || 0), 0), [quiz]);

    const onStart = () => {
        if (!quiz) return;
        setStage("running");
        setIndex(0);
        setAnswers([]);
        setTotalPoints(0);
        setLeaderboard([]);
        isResolvingRef.current = false;
        setTimeout(() => startScreen(0), 200);
    };

    function startScreen(i) {
        const sc = quiz.screens[i];
        const scProps = sc?.properties || {};
        const t = Number(scProps.timeLimit ?? quiz?.timeLimit ?? DEFAULT_SCREEN_TIME) || DEFAULT_SCREEN_TIME;
        isResolvingRef.current = false;
        setScreenState("question");
        setCurrentTL(t);
        setRemaining(t);
        setRunning(t > 0);
    }

    function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

    function mapServerAnswers(serverAnswers) {
        return serverAnswers.map((aa) => ({
            screenId: String(aa.screenId),
            answer: aa.provided,
            correct: !!aa.correct,
            points: Number(aa.points || 0),
            basePoints: Number(aa.basePoints || 0),
            timeTaken: Number(aa.timeTaken || 0),
            timeBonus: Number(aa.timeBonus || 0),
        }));
    }

    function defaultProvided(screen, existing) {
        if (existing?.answer !== undefined) return existing.answer;
        if (screen.type === "multiple") return [];
        if (screen.type === "slider") return screen.properties?.default ?? null;
        return "";
    }

    async function sendAttempt(answersPayload, finish) {
        try {
            const attempt = await submitQuizAttemptAPI(quizId, { answers: answersPayload, finish }, token);
            return { attempt, isAlreadyFinished: false };
        } catch (err) {
            const isAlreadyFinished = err?.response?.status === 409;
            showToast(
                isAlreadyFinished
                    ? "You have already finished this quiz."
                    : (err?.response?.data?.message || "Could not submit your answer. Check your connection."),
                "error"
            );
            return { attempt: null, isAlreadyFinished };
        }
    }

    async function showResolvedScreen(serverAnswers) {
        if (Array.isArray(serverAnswers)) setAnswers(mapServerAnswers(serverAnswers));
        setScreenState("reveal");
        await delay(REVEAL_DURATION);
        setScreenState("scoreboard");
        await delay(SCOREBOARD_DURATION);
        await goNext();
    }

    async function resolveCurrentScreen(provided, isTimeUp = false) {
        if (!currentScreen || isResolvingRef.current) return;
        isResolvingRef.current = true;
        setRunning(false);

        const screenId = String(currentScreen._id);
        const timeTaken = Math.max(0, currentTL - remaining);
        const { attempt, isAlreadyFinished } = await sendAttempt([{ screenId, provided, timeTaken }], false);

        if (isAlreadyFinished) {
            await finishQuiz(true);
            return;
        }
        if (!attempt) {
            if (!isTimeUp) {
                isResolvingRef.current = false;
                setRunning(true);
                return;
            }
            setAnswers((prev) => [...prev.filter((a) => String(a.screenId) !== screenId), { screenId, answer: provided, correct: false, points: 0, timeTaken }]);
            await showResolvedScreen(null);
            return;
        }

        setTotalPoints(Number(attempt.totalPoints || 0));
        await showResolvedScreen(attempt.answers || []);
    }

    const onTimeUp = () => {
        if (screenState !== "question" || !currentScreen) return;
        const existing = answers.find(a => String(a.screenId) === String(currentScreen._id));
        resolveCurrentScreen(defaultProvided(currentScreen, existing), true);
    };

    const submitAnswer = (provided) => {
        if (screenState !== "question") return;
        resolveCurrentScreen(provided);
    };

    async function finishQuiz(knownAlreadyFinished = false) {
        let attempt = null;
        if (!knownAlreadyFinished) {
            ({ attempt } = await sendAttempt([], true));
        }
        if (attempt) setTotalPoints(Number(attempt.totalPoints || 0));
        try {
            const res = await getQuizLeaderboardAPI(quizId, token);
            if (res?.board) setLeaderboard(res.board);
        } catch {
            showToast("Could not load the leaderboard.", "error");
        }
        setStage("results");
        setRunning(false);
        setRemaining(0);
    }

    async function goNext() {
        const next = index + 1;
        if (!quiz || next >= (quiz.screens || []).length) {
            await finishQuiz();
            return;
        }
        setIndex(next);
        startScreen(next);
    }

    const onSelectOption = (idx) => {
        if (!currentScreen) return;
        if (screenState !== "question") return;
        const screenId = String(currentScreen._id);
        if ((currentScreen.properties || {}).answerMode === "multiple") {
            const existingObj = answers.find(a => String(a.screenId) === screenId);
            const arr = existingObj?.answer ? (Array.isArray(existingObj.answer) ? [...existingObj.answer] : [existingObj.answer]) : [];
            const sidx = arr.findIndex(v => String(v) === String(idx));
            if (sidx === -1) arr.push(String(idx)); else arr.splice(sidx, 1);
            setAnswers(prev => [...prev.filter(p => String(p.screenId) !== screenId), { screenId, answer: arr }]);
            return;
        }
        setAnswers(prev => [...prev.filter(p => String(p.screenId) !== screenId), { screenId, answer: String(idx) }]);
        setTimeout(() => submitAnswer(String(idx)), 300);
    };

    const onSubmitMultiple = () => {
        const existing = answers.find(a => String(a.screenId) === String(currentScreen._id));
        submitAnswer(existing?.answer || []);
    };

    const onSubmitShort = (val) => { if (!val) return; submitAnswer(val); };
    const onSubmitSlider = (val) => submitAnswer(val);

    // Fallback leaderboard build (only used if server leaderboard missing)
    function buildLeaderboardFallback(finalScore) {
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

    if (stage === "landing") {
        return <Landing quiz={quiz} onStart={onStart} onBack={() => navigate(-1)} />;
    }

    if (stage === "results") {
        const finalScore = totalPoints;
        const serverBoard = Array.isArray(leaderboard) && leaderboard.length ? leaderboard : null;
        const boardToShow = serverBoard || buildLeaderboardFallback(finalScore);

        return (
            <div className="fixed inset-0 z-[1000] bg-gradient-to-br from-slate-50 to-white p-6 overflow-auto">
                <div className="max-w-4xl mx-auto min-h-[70vh] flex items-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full">
                        <LeaderboardPanel
                            board={boardToShow}
                            finalScore={finalScore}
                            totalPossible={totalPossible}
                            answers={answers}
                            screens={quiz.screens}
                        />

                        <div className="mt-6 flex justify-end gap-2">
                            <IconBtn text="Close" onClick={() => navigate(-1)} textClass={"text-slate-500"} className="bg-white" />
                            <IconBtn text="Retake" onClick={() => { setStage("landing"); setIndex(0); setAnswers([]); setTotalPoints(0); setLeaderboard([]); }} className="bg-indigo-600 text-white" />
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (stage === "running" && currentScreen) {
        const props = currentScreen.properties || {};
        const tl = Number(currentTL || 0);
        const existing = answers.find(a => String(a.screenId) === String(currentScreen._id));
        const percent = tl > 0 ? Math.max(0, Math.min(100, Math.round((remaining / tl) * 100))) : 100;
        const ringStyle = { background: `conic-gradient(#7c3aed ${percent}%, #e6e6e6 ${percent}%)` };

        return (
            <div className="fixed inset-0 z-[1100] bg-gradient-to-br from-indigo-50 to-white p-6 overflow-auto">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-full max-w-4xl">
                        <div className="flex items-center justify-between mb-4">
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
                            <motion.div key={currentScreen._id + "-" + screenState} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={PAGE_TRANSITION} className="rounded-2xl p-8 bg-white shadow-2xl flex flex-col md:flex-row items-center gap-8">
                                <div className="flex-shrink-0 flex items-center justify-center">
                                    <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center" aria-hidden>
                                        <div className="absolute inset-0 rounded-full" style={ringStyle}></div>
                                        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-white flex flex-col items-center justify-center shadow">
                                            <div className="text-sm text-slate-400">Time</div>
                                            <div className="text-3xl font-extrabold">{Math.ceil(remaining)}</div>
                                            <div className="text-xs text-slate-400 mt-1">{tl}s</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full">
                                    <div className="text-center">
                                        <div className="text-2xl md:text-3xl font-extrabold">{currentScreen.body}</div>
                                        <div className="text-sm text-slate-500 mt-2">{currentScreen.type} • {props.points || 0} pts</div>
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 gap-4">
                                        {currentScreen.type === "multiple" && (
                                            <MultipleScreen
                                                screen={currentScreen}
                                                selected={existing?.answer}
                                                disabled={screenState !== "question"}
                                                onSelectOption={onSelectOption}
                                                onSubmitMultiple={onSubmitMultiple}
                                                showCorrect={screenState !== "question"}
                                                result={existing}
                                                answerMode={props.answerMode || "single"}
                                            />
                                        )}

                                        {currentScreen.type === "truefalse" && (
                                            <TrueFalseScreen
                                                selected={existing?.answer}
                                                disabled={screenState !== "question"}
                                                onSelectOption={onSelectOption}
                                                options={currentScreen.options}
                                            />
                                        )}

                                        {currentScreen.type === "short" && (
                                            <ShortAnswerScreen initial={existing?.answer || ""} disabled={screenState !== "question"} onSubmit={onSubmitShort} />
                                        )}

                                        {currentScreen.type === "slider" && (
                                            <SliderScreen screen={currentScreen} value={existing?.answer} disabled={screenState !== "question"} onSubmit={onSubmitSlider} />
                                        )}

                                        {currentScreen.type === "poll" && (
                                            <PollScreen screen={currentScreen} selected={existing?.answer} disabled={screenState !== "question"} onSelectOption={onSelectOption} />
                                        )}
                                    </div>

                                    {screenState !== "question" && (
                                        <RevealPanel answer={answers.find(a => String(a.screenId) === String(currentScreen._id))} />
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-xs text-slate-500">Press <strong>Quit</strong> to exit</div>
                            <div className="flex items-center gap-3">
                                <div className="text-xs text-slate-400">Progress</div>
                                <div className="w-48 h-2 bg-slate-100 rounded overflow-hidden">
                                    <div style={{ width: `${Math.round(((index) / (quiz.screens?.length || 1)) * 100)}%` }} className="h-2 bg-indigo-500"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
