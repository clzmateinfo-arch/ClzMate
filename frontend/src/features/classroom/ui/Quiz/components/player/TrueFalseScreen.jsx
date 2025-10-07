export default function TrueFalseScreen({ selected = null, disabled = false, onSelectOption = () => { }, options = null }) {
    const opts = options || [{ text: "True" }, { text: "False" }];

    return (
        <div className="flex items-center gap-4 justify-center">
            {opts.map((o, idx) => {
                const label = o.text || (idx === 0 ? "True" : "False");
                const selectedNow = String(selected) === String(idx);
                return (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => !disabled && onSelectOption(idx)}
                        disabled={disabled}
                        aria-pressed={selectedNow}
                        className={`px-8 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition
                        ${selectedNow ? "bg-emerald-600 text-white shadow" : "bg-white border border-slate-100 text-slate-900 hover:-translate-y-0.5"}`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
