/* eslint-disable react/prop-types */
import React, { useRef, useEffect } from "react";
import { AiOutlineCheck } from "react-icons/ai";
import { useLocation } from "react-router-dom";

export default function FieldsetRadio({
  name,
  label,
  options = [],
  value,
  onChange,
  required = false,
  error,
  helpText,
  orientation = "row",
  className = "",
}) {
  const optionRefs = useRef([]);

  optionRefs.current = options.map((_, i) => optionRefs.current[i] ?? React.createRef());

  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0 && optionRefs.current[idx]?.current) {
      optionRefs.current[idx].current.tabIndex = 0;
    }
    options.forEach((_, i) => {
      if (i !== idx && optionRefs.current[i]?.current) {
        optionRefs.current[i].current.tabIndex = -1;
      }
    });
  }, [value, options, useLocation().pathname]);

  const focusByIndex = (idx) => {
    const el = optionRefs.current[idx]?.current;
    if (el) el.focus();
  };

  const handleKeyDown = (e, idx) => {
    const key = e.key;
    const last = options.length - 1;
    let nextIdx = idx;

    if (key === "ArrowRight" || key === "ArrowDown") {
      nextIdx = idx === last ? 0 : idx + 1;
      e.preventDefault();
      onChange(options[nextIdx].value);
      focusByIndex(nextIdx);
    } else if (key === "ArrowLeft" || key === "ArrowUp") {
      nextIdx = idx === 0 ? last : idx - 1;
      e.preventDefault();
      onChange(options[nextIdx].value);
      focusByIndex(nextIdx);
    } else if (key === "Home") {
      e.preventDefault();
      onChange(options[0].value);
      focusByIndex(0);
    } else if (key === "End") {
      e.preventDefault();
      onChange(options[last].value);
      focusByIndex(last);
    }
  };

  return (
    <fieldset className={`w-full mb-5 ${className}`}>
      {label && (
        <legend className="text-sm font-medium text-[#0b1220] mb-2">
          {label} {required && <span className="text-red-500"> *</span>}
        </legend>
      )}

      {helpText && !error && <p className="mb-3 text-sm text-gray-500">{helpText}</p>}

      <div
        role="radiogroup"
        aria-label={label || name}
        aria-required={required}
        className={`flex ${orientation === "row" ? "flex-row" : "flex-col"} gap-3 flex-wrap`}
      >
        {options.map((opt, i) => {
          const isActive = value === opt.value;
          return (
            <div
              key={opt.value}
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              ref={(el) => (optionRefs.current[i].current = el)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onClick={() => onChange(opt.value)}
              onFocus={() => {
                optionRefs.current.forEach((r, idx) => {
                  if (r?.current) r.current.tabIndex = idx === i ? 0 : -1;
                });
              }}
              className={`inline-flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer select-none transition-all border-2
                ${isActive ? "border-violet-500 bg-violet-50 shadow-sm" : "border-[#E6EAF2] hover:bg-violet-50/30"}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#996bec]/40`}
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition
                  ${isActive
                    ? "bg-gradient-to-br from-[#ba7bf0]/20 to-[#996bec]/10 text-[#6d28d9] ring-1 ring-violet-200/30"
                    : "bg-white text-gray-600 ring-1 ring-gray-100"}`}
                aria-hidden
              >
                {isActive ? (
                  <AiOutlineCheck className="w-4 h-4" />
                ) : opt.icon ? (
                  typeof opt.icon === "string" ? (
                    <img src={opt.icon} alt="" className="w-4 h-4 object-contain" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center">{opt.icon}</span>
                  )
                ) : null}
              </span>

              <span
                className={`text-sm font-medium ${
                  isActive ? "text-[#0b1220]" : "text-[#374151]"
                }`}
              >
                {opt.label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
