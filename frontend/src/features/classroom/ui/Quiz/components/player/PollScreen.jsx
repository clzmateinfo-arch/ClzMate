import React from "react";

/**
 * PollScreen - modern light theme
 * Props:
 *  - screen: { options: [{ text, votes? }] }
 *  - selected: index | string | array
 *  - disabled: bool
 *  - onSelectOption(idx)
 */
export default function PollScreen({ screen = {}, selected = null, disabled = false, onSelectOption = () => { } }) {
    const opts = screen.options || [];
    const isSelected = (i) =>
        String(selected) === String(i) || (Array.isArray(selected) && selected.map(String).includes(String(i)));

    // compute total votes if vote counts available (optional)
    const totalVotes = opts.reduce((s, o) => s + (Number(o.votes || 0)), 0);

    return (
        <div className="space-y-3">
            {opts.map((opt, i) => {
                const sel = isSelected(i);
                const pct = totalVotes ? Math.round(((Number(opt.votes || 0)) / totalVotes) * 100) : null;

                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => !disabled && onSelectOption(i)}
                        disabled={disabled}
                        aria-pressed={sel}
                        className={`w-full p-4 mt-3 mb-1 rounded-xl text-left border shadow-sm flex items-center gap-4 focus:outline-none focus:ring-2 focus:ring-offset-1 transition
                        ${sel ? "bg-indigo-600 text-white border-indigo-600 hover:shadow-lg" : "bg-white text-slate-900 border-slate-100 hover:-translate-y-0.5"}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${sel ? "bg-white text-indigo-700" : "bg-indigo-50 text-indigo-700"}`}>
                            {i + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="text-base font-medium truncate">{opt.text}</div>

                            <div className="text-xs mt-1 text-slate-400 flex items-center gap-2">
                                {pct !== null ? <span>{pct}%</span> : <span>{opt.hint || ""}</span>}

                                {pct !== null && (
                                    <div className="flex-1 ml-2">
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div style={{ width: `${pct}%` }} className="h-2 rounded-full" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            {sel ? <span className="text-lg">✅</span> : <span className="text-xs text-slate-400">pick</span>}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
