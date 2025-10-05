export default function IconBtn({
  text,
  onClick,
  onclick,
  children,
  disabled = false,
  outline = false,
  className = "",
  customClasses = "",
  type = "button",
}) {
  const handleClick = (e) => {
    if (disabled) return;
    const fn = onClick ?? onclick;
    if (typeof fn === "function") fn(e);
  };

  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const filled = "text-white shadow-sm hover:shadow-md hover:brightness-95 focus:ring-violet-300";
  const outlineStyle = "bg-white/6 text-violet-600 border border-white/10 backdrop-blur-md hover:bg-white/10 focus:ring-violet-200";
  const disabledCls = disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer";
  const classes = ` ${customClasses} ${base} ${outline ? outlineStyle : filled} ${disabledCls} ${className}`;

  return (
    <button
      type={type}
      onClick={handleClick}
      aria-disabled={disabled}
      disabled={disabled}
      className={classes}
    >
      {children ? (
        <>
          <span className="flex items-center justify-center">{children}</span>
          <span className="truncate">{text}</span>
        </>
      ) : (
        <span className="truncate">{text}</span>
      )}
    </button>
  );
}