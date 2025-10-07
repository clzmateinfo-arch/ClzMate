import React from "react";

function Button(
  {
    children,
    variant = "primary",
    className = "",
    onClick,
    type = "button",
    disabled = false,
    animated = false,
    style = {},
    "aria-label": ariaLabel,
  },
  ref
) {
  const base = "relative inline-flex items-center gap-3 rounded-full px-6 py-4 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition";
  const primary = "bg-gradient-to-r btn-purple bg-violet-300 bg-violet-600 hover:bg-violet-600 text-white text-sm transition-colors shadow-md hover:opacity-95 focus:ring-[#996bec]";
  const light = "inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm text-black font-semibold dark:bg-gray-800/6 backdrop-blur-sm ring-1 ring-white/20 hover:bg-gray-800/8 transition";
  const disabledCls = "opacity-60 cursor-not-allowed pointer-events-none";

  const variantClass = variant === "primary" ? primary : variant === "light" ? light : variant === "base" ? base : disabledCls;
  const finalClass = `${base} ${variantClass} ${disabled ? disabledCls : ""} ${className} group`;

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      style={style}
      disabled={disabled}
      aria-label={ariaLabel ?? (typeof children === "string" ? children : "Call to action")}
      className={finalClass}
    >
      <span className="flex-1 text-center text-sm md:text-base leading-none">{children}</span>

      {animated ? (<span
        aria-hidden
        className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center pointer-events-none"
      >
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="4"
          fill="currentColor"
          className="mr-2 w-0 opacity-0 transform translate-x-2 transition-all duration-200 group-hover:opacity-30 group-hover:w-3 group-hover:translate-x-0"
          aria-hidden
        >
          <path d="M1 9h14a1 1 0 000-2H1a1 1 0 000 2z" />
        </svg>

        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="currentColor"
          className="h-4 w-4 transform translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
          aria-hidden
        >
          <path d="M7.293 1.707L13.586 8l-6.293 6.293a1 1 0 001.414 1.414l7-7a1 1 0 000-1.414l-7-7a1 1 0 00-1.414 1.414z" />
        </svg>
      </span>) : (<></>)}
    </button>
  );
}

export default React.forwardRef(Button);
