// frontend/src/features/classroom/ui/Quiz/QuizPlayer.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { getQuizAPI, submitQuizAttemptAPI, getQuizLeaderboardAPI } from "@/entities/classroom/model/classroomAPI";
import IconBtn from "@/shared/components/ui/IconBtn";
import { toast } from "react-hot-toast";

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

    // Score locally (used for immediate UX). Server will be authoritative when available.
    function scoreAnswer(screen, provided, effectiveTimeLimit, remainingLocal = remaining) {
        const props = screen.properties || {};
        const base = Number(props.points || 0) || 0;
        const timeLimit = Number(effectiveTimeLimit || props.timeLimit || quiz?.timeLimit || DEFAULT_SCREEN_TIME) || 0;
        const timeTaken = Math.max(0, (timeLimit - (remainingLocal || 0)));
        const answerMode = props.answerMode || "single";
        let correct = false;

        if (screen.type === "multiple" || screen.type === "truefalse") {
            const correctSet = (screen.options || []).map((o, i) => (o.correct ? String(i) : null)).filter(Boolean);
            if (answerMode === "multiple") {
                const providedArr = Array.isArray(provided) ? provided.map(String) : (provided ? [String(provided)] : []);
                correct = providedArr.length > 0 && providedArr.length === correctSet.length && providedArr.every((id) => correctSet.includes(String(id)));
            } else {
                correct = correctSet.includes(String(provided));
            }
        } else if (screen.type === "short") {
            const expected = (screen.options || []).map((o) => (o.text || "").trim().toLowerCase()).filter(Boolean);
            const resp = (provided || "").toString().trim().toLowerCase();
            correct = expected.length === 0 ? false : expected.includes(resp);
        } else if (screen.type === "slider") {
            const target = (screen.options && screen.options[0] && (screen.options[0].value !== undefined ? Number(screen.options[0].value) : (screen.options[0].text !== undefined ? Number(screen.options[0].text) : null))) || null;
            const val = Number(provided);
            if (target === null || isNaN(target)) {
                correct = true;
            } else {
                correct = !isNaN(val) && Math.abs(val - target) === 0;
            }
        } else if (screen.type === "poll") {
            correct = false;
        } else {
            correct = false;
        }

        const timeBonus = timeLimit > 0 ? Math.round(base * ((Math.max(0, timeLimit - timeTaken) / timeLimit) * 0.5)) : 0;
        const pointsEarned = correct ? base + timeBonus : 0;
        return { correct, pointsEarned, base, timeTaken, timeBonus };
    }

    const onStart = () => {
        if (!quiz) return;
        setStage("running");
        setIndex(0);
        setAnswers([]);
        setTotalPoints(0);
        // reset leaderboard when starting a new run (optional)
        setLeaderboard([]);
        setTimeout(() => startScreen(0), 200);
    };

    function startScreen(i) {
        const sc = quiz.screens[i];
        const scProps = sc?.properties || {};
        const t = Number(scProps.timeLimit ?? quiz?.timeLimit ?? DEFAULT_SCREEN_TIME) || DEFAULT_SCREEN_TIME;
        setScreenState("question");
        setCurrentTL(t);
        setRemaining(t);
        setRunning(t > 0);
    }

    const onTimeUp = async () => {
        if (screenState !== "question") return;
        setRunning(false);
        setScreenState("reveal");

        const existing = answers.find(a => String(a.screenId) === String(currentScreen._id));
        const provided = existing ? existing.answer : (currentScreen.type === "multiple" ? [] : (currentScreen.type === "slider" ? currentScreen.properties?.default : ""));
        const { correct, pointsEarned, base, timeTaken, timeBonus } = scoreAnswer(currentScreen, provided, currentTL);
        // record locally and sync to server
        const newAnswers = recordAnswerAndReturn({ screenId: currentScreen._id, provided, correct, pointsEarned, base, timeTaken, timeBonus });

        // show reveal -> scoreboard -> next (with increased durations)
        await delay(REVEAL_DURATION);
        setScreenState("scoreboard");
        await delay(SCOREBOARD_DURATION);
        await goNext(newAnswers);
    };

    function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

    // recordAnswer but also returns the updated answers array for immediate use
    function recordAnswerAndReturn({ screenId, provided, correct, pointsEarned, base, timeTaken, timeBonus }) {
        const entry = { screenId, answer: provided, correct, points: pointsEarned, basePoints: base, timeTaken, timeBonus };
        // build newAnswers deterministically (replace existing for same screenId)
        const copy = [...answers.filter(p => String(p.screenId) !== String(screenId))];
        const newArr = [...copy, entry];
        setAnswers(newArr);
        // update local total points (note: server will be authoritative if available)
        setTotalPoints(_prev => {
            const recomputed = newArr.reduce((s, a) => s + (a.points || 0), 0);
            return recomputed;
        });
        // sync to server (don't await here)
        syncAttemptToServer(newArr, false);
        return newArr;
    }

    // Generic attempt -> server sync
    async function syncAttemptToServer(answersArr = answers, finish = false) {
        if (!token) {
            // no auth — can't persist attempts or fetch leaderboard
            return null;
        }
        if (!quizId) return null;
        try {
            const payload = {
                answers: (answersArr || []).map(a => ({
                    screenId: a.screenId,
                    provided: a.answer,
                    timeTaken: Number(a.timeTaken || 0),
                })),
                finish: !!finish,
            };
            const attempt = await submitQuizAttemptAPI(quizId, payload, token);
            if (attempt) {
                // server-calculated authoritative answers & totalPoints
                // attempt.answers may be an array with screenId, provided, correct, points, basePoints, timeTaken ...
                if (Array.isArray(attempt.answers)) {
                    // Map server attempt answers to our local format
                    const mapped = attempt.answers.map((aa) => ({
                        screenId: String(aa.screenId),
                        answer: aa.provided,
                        correct: !!aa.correct,
                        points: Number(aa.points || 0),
                        basePoints: Number(aa.basePoints || aa.base || 0),
                        timeTaken: Number(aa.timeTaken || 0),
                        timeBonus: Number(aa.timeBonus || 0),
                    }));
                    setAnswers(mapped);
                    setTotalPoints(Number(attempt.totalPoints || 0));
                } else {
                    // fallback: update totalPoints only
                    setTotalPoints(Number(attempt.totalPoints || 0));
                }

                // fetch and update leaderboard (real participants)
                try {
                    const res = await getQuizLeaderboardAPI(quizId, token);
                    if (res && res.board) {
                        setLeaderboard(res.board || []);
                    }
                } catch (lbErr) {
                    console.warn("Failed to fetch leaderboard after submit:", lbErr);
                }
            }
            return attempt;
        } catch (err) {
            console.warn("syncAttemptToServer failed", err);
            return null;
        }
    }

    const submitAnswer = async (provided) => {
        if (!currentScreen) return;
        if (screenState !== "question") return;
        setRunning(false);
        const { correct, pointsEarned, base, timeTaken, timeBonus } = scoreAnswer(currentScreen, provided, currentTL);
        const newAnswers = recordAnswerAndReturn({ screenId: currentScreen._id, provided, correct, pointsEarned, base, timeTaken, timeBonus });
        setScreenState("reveal");
        await delay(1600);
        setScreenState("scoreboard");
        await delay(2000);
        await goNext(newAnswers);
    };

    // Make goNext asynchronous so we can finalize attempt at the end
    async function goNext(currentAnswers = answers) {
        setScreenState("question");
        const next = index + 1;
        if (!quiz || next >= (quiz.screens || []).length) {
            // finalize attempt on server if token present
            await syncAttemptToServer(currentAnswers, true);
            setStage("results");
            setRunning(false);
            setRemaining(0);
            return;
        }
        setIndex(next);
        startScreen(next);
    }

    const onSelectOption = (idx) => {
        if (!currentScreen) return;
        if (screenState !== "question") return;
        const props = currentScreen.properties || {};
        if (props.answerMode === "multiple") {
            const existingObj = answers.find(a => String(a.screenId) === String(currentScreen._id));
            let arr = existingObj?.answer ? (Array.isArray(existingObj.answer) ? [...existingObj.answer] : [existingObj.answer]) : [];
            const sidx = arr.findIndex(v => String(v) === String(idx));
            if (sidx === -1) arr.push(String(idx)); else arr.splice(sidx, 1);

            setAnswers(prev => {
                const copy = prev.filter(p => String(p.screenId) !== String(currentScreen._id));
                const newArr = [...copy, { screenId: currentScreen._id, answer: arr }];
                // sync partially (we will submit once user clicks submit)
                syncAttemptToServer(newArr, false).catch(() => {});
                return newArr;
            });
        } else {
            // immediate selection for single-answer
            setAnswers(prev => {
                const copy = prev.filter(p => String(p.screenId) !== String(currentScreen._id));
                const newArr = [...copy, { screenId: currentScreen._id, answer: String(idx) }];
                // we will call submitAnswer which will score & sync
                return newArr;
            });
        }

        if ((currentScreen.properties || {}).answerMode !== "multiple") {
            setTimeout(() => submitAnswer(String(idx)), 300);
        }
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
