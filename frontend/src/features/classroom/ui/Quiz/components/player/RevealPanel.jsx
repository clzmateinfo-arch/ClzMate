
/**
 * RevealPanel - stylish reveal with points and optional details
 * Props:
 *  - answer: { correct, points, timeTaken, timeBonus }
 */
export default function RevealPanel({ answer = {} }) {
    const correct = !!answer.correct;
    return (
        <div className="mt-6 p-4 rounded-lg bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl ${correct ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {correct ? "✅" : "❌"}
                </div>
                <div className="text-center">
                    <div className={`text-lg font-semibold ${correct ? "text-emerald-800" : "text-rose-800"}`}>
                        {correct ? "Correct" : "Incorrect"}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                        Points: <span className="font-semibold text-slate-900">{answer.points ?? 0}</span>
                        {typeof answer.timeTaken === "number" ? <span className="ml-3">Time: {Math.round(answer.timeTaken)}s</span> : null}
                        {typeof answer.timeBonus === "number" ? <span className="ml-2 text-xs text-emerald-600"> (+{answer.timeBonus ?? 0} bonus)</span> : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
