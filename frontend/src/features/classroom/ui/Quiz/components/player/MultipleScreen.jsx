export default function MultipleScreen({
  screen = {},
  selected = null,
  disabled = false,
  onSelectOption = () => {},
  onSubmitMultiple = () => {},
  showCorrect = false,
  answerMode = "single",
}) {
  const opts = screen.options || [];

  const isSelected = (i) => {
    if (Array.isArray(selected)) return selected.map(String).includes(String(i));
    return String(selected) === String(i);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {opts.map((opt, i) => {
        const selectedNow = isSelected(i);
        const correct = !!opt.correct;
        const revealCorrect = showCorrect && correct;
        const revealWrong = showCorrect && selectedNow && !correct;

        const baseClasses =
          "w-full text-left p-4 rounded-xl transition transform border shadow-sm flex items-center gap-4 focus:outline-none";
        const interactiveClasses = disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-lg hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-1 focus:ring-indigo-200";

        const variantClass = revealCorrect
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : revealWrong
          ? "bg-rose-50 border-rose-200 text-rose-700"
          : selectedNow
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white border-slate-100 text-slate-900";

        const bubbleClass = revealCorrect
          ? "bg-emerald-100 text-emerald-800"
          : revealWrong
          ? "bg-rose-100 text-rose-700"
          : selectedNow
          ? "bg-white text-indigo-700"
          : "bg-indigo-50 text-indigo-700";

        return (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && onSelectOption(i)}
            disabled={disabled}
            aria-pressed={selectedNow}
            aria-disabled={disabled}
            className={`${baseClasses} ${interactiveClasses} ${variantClass}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg ${bubbleClass}`}>
              {i + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className={`text-lg font-medium truncate ${selectedNow && !showCorrect ? "text-white" : ""}`}>
                {opt.text}
              </div>
              {opt.explanation && showCorrect && (
                <div className="text-xs mt-1 text-slate-500 line-clamp-2">
                  {opt.explanation}
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              {revealCorrect && <span className="text-2xl">✅</span>}
              {revealWrong && <span className="text-2xl">❌</span>}
            </div>
          </button>
        );
      })}

      {answerMode === "multiple" && (
        <div className="flex justify-end mt-1">
          <button
            onClick={onSubmitMultiple}
            disabled={disabled}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:shadow-md disabled:opacity-60"
          >
            Submit answer
          </button>
        </div>
      )}
    </div>
  );
}
