import React, { useMemo } from "react";

export default function LeaderboardPanel({
    board = [],
    finalScore = 0,
    totalPossible = 0,
    answers = [],
    screens = [],
}) {
    const pct = totalPossible > 0 ? Math.round((finalScore / totalPossible) * 100) : 0;

    const TopBadge = ({ rank }) => {
        if (rank === 1) return <div className="px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">1st</div>;
        if (rank === 2) return <div className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">2nd</div>;
        if (rank === 3) return <div className="px-2 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700">3rd</div>;
        return <div className="px-2 py-1 rounded-md text-xs text-slate-500">#{rank}</div>;
    };

    const screensById = useMemo(() => {
        const m = {};
        (screens || []).forEach((s) => { if (s && s._id) m[String(s._id)] = s; });
        return m;
    }, [screens]);

    const orderedAnswers = useMemo(() => {
        const byId = (answers || []).reduce((acc, a) => { acc[String(a.screenId)] = a; return acc; }, {});
        return (screens || []).map((s) => {
            const a = byId[String(s._id)];
            return a ? { screen: s, answer: a } : null;
        }).filter(Boolean);
    }, [answers, screens]);

    return (
        <div className="rounded-2xl p-6 bg-white shadow-md w-full">
            <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                    <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Quiz complete 🎉</div>
                    <div className="text-sm text-slate-500 mt-1">Results & leaderboard</div>

                    <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                            <div className="text-xs text-slate-500">Your score</div>
                            <div className="text-lg font-bold text-slate-900">{finalScore}</div>
                            {totalPossible ? <div className="text-xs text-slate-400">/ {totalPossible}</div> : null}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-sm font-semibold text-indigo-700 shadow-sm">
                                {pct}%
                            </div>

                            <div className="w-36">
                                <div className="text-xs text-slate-400">Progress</div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="h-2 rounded-full"
                                        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex flex-col items-end gap-2">
                    <div className="text-xs text-slate-400">Final score</div>
                    <div className="text-3xl font-extrabold text-slate-900">{finalScore}</div>
                    {totalPossible ? <div className="text-sm text-slate-500">of {totalPossible}</div> : null}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-4 bg-white/50 border border-slate-100 overflow-auto" style={{ maxHeight: 420 }}>
                    <div className="text-sm font-semibold mb-3 text-slate-700">Summary</div>

                    {orderedAnswers.length === 0 ? (
                        <div className="text-xs text-slate-500">No answers recorded.</div>
                    ) : (
                        <div className="space-y-3">
                            {orderedAnswers.map(({ screen, answer }, idx) => {
                                const correct = !!answer.correct;
                                return (
                                    <div key={screen._id || idx} className="flex items-start justify-between gap-3 p-2 rounded-md bg-white shadow-sm border border-slate-100">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`text-xs font-semibold px-2 py-1 rounded ${correct ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
                                                    {correct ? "Correct" : "Wrong"}
                                                </div>
                                                <div className="text-sm font-medium text-slate-900 truncate">{screen.body}</div>
                                            </div>

                                            <div className="text-xs text-slate-400 mt-1">
                                                <span className="mr-2">Type: {screen.type}</span>
                                                {typeof answer.timeTaken === "number" ? <span className="mr-2">Time: {Math.round(answer.timeTaken)}s</span> : null}
                                                <span>Base: {answer.basePoints ?? 0} pts</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end justify-center">
                                            <div className="text-sm font-semibold text-slate-900">{answer.points ?? 0} pts</div>
                                            <div className="text-xs text-slate-400 mt-1">Earned</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="rounded-xl p-4 bg-white/50 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-slate-700">Leaderboard</div>
                        <div className="text-xs text-slate-400">{board.length} players</div>
                    </div>

                    <div className="space-y-3">
                        {board.map((p) => {
                            const initials = String(p.name || "U")
                                .split(" ")
                                .map((s) => s[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();
                            const isYou = String(p.id) === "you";

                            return (
                                <div
                                    key={p.id}
                                    className={`flex items-center justify-between gap-4 p-3 rounded-lg transition ${isYou ? "bg-indigo-50 border border-indigo-100 shadow-sm" : "bg-white border border-slate-100"
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${isYou ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow" : "bg-indigo-50 text-indigo-700"
                                                }`}
                                            aria-hidden
                                        >
                                            {initials}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-medium truncate text-slate-900">{p.name}{isYou ? " (You)" : ""}</div>
                                                <div className="hidden sm:block"><TopBadge rank={p.rank} /></div>
                                            </div>
                                            <div className="text-xs text-slate-400">Place #{p.rank}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-slate-500">Score</div>
                                        <div className="text-lg font-bold text-slate-900">{p.score}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
