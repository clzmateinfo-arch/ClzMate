import React, { forwardRef, useEffect, useId, useRef, useState } from "react";

const normalizeOption = (opt) =>
    typeof opt === "string" ? { value: opt, label: opt, disabled: false } : { value: opt.value, label: opt.label, disabled: !!opt.disabled };

const Select = forwardRef(
    (
        {
            id,
            name,
            label,
            required = false,
            options = [],
            children = null,
            placeholder,
            value: controlledValue,
            onChange,
            error,
            helpText,
            ariaLabel,
            className = "",
            selectClass = "",
            disabled = false,
            searchable = true,
            maxHeight = 240,
            ...rest
        },
        ref
    ) => {
        const uid = useId();
        const containerRef = useRef(null);
        const buttonRef = useRef(null);
        const searchRef = useRef(null);

        const _options = children ? [] : options.map((o) => normalizeOption(o));

        const [open, setOpen] = useState(false);

        const [internalValue, setInternalValue] = useState(controlledValue ?? "");
        useEffect(() => {
            if (controlledValue !== undefined) setInternalValue(controlledValue);
        }, [controlledValue]);

        const [filter, setFilter] = useState("");
        useEffect(() => {
            if (!open) setFilter("");
        }, [open]);

        const filteredOptions = _options.filter((opt) =>
            opt.label.toLowerCase().includes(filter.trim().toLowerCase())
        );

        const [activeIndex, setActiveIndex] = useState(0);
        useEffect(() => {
            if (activeIndex >= filteredOptions.length) setActiveIndex(filteredOptions.length - 1);
        }, [filteredOptions.length, activeIndex]);

        useEffect(() => {
            const onDoc = (e) => {
                if (!containerRef.current) return;
                if (!containerRef.current.contains(e.target)) {
                    setOpen(false);
                }
            };
            document.addEventListener("mousedown", onDoc);
            return () => document.removeEventListener("mousedown", onDoc);
        }, []);

        useEffect(() => {
            if (!open) return;
            const onKey = (e) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    setOpen(false);
                    buttonRef.current?.focus();
                } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
                    scrollActiveIntoView();
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, 0));
                    scrollActiveIntoView();
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    const opt = filteredOptions[activeIndex];
                    if (opt && !opt.disabled) selectOption(opt);
                }
            };
            window.addEventListener("keydown", onKey);
            return () => window.removeEventListener("keydown", onKey);
        }, [open, filteredOptions, activeIndex]);

        const scrollActiveIntoView = () => {
            const el = containerRef.current?.querySelector(`[data-opt-index="${activeIndex}"]`);
            if (el) el.scrollIntoView({ block: "nearest" });
        };

        const handleToggle = () => {
            if (disabled) return;
            setOpen((s) => {
                const next = !s;
                if (next) {
                    setTimeout(() => searchRef.current?.focus(), 80);
                }
                return next;
            });
        };

        const selectOption = (opt) => {
            setInternalValue(opt.value);
            if (typeof onChange === "function") {
                const syntheticEvent = { target: { name: name || id, value: opt.value } };
                onChange(syntheticEvent);
            }
            setOpen(false);
            buttonRef.current?.focus();
        };

        const selectedLabel = (() => {
            const all = _options;
            const found = all.find((o) => o.value === internalValue);
            return found ? found.label : "";
        })();

        const baseBtn = "w-full text-left rounded-xl border bg-white/95 text-[#0b1220] shadow-sm transition duration-200 flex items-center justify-between px-4 py-3";
        const focusBtn = "focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#996bec]/70";
        const errorClass = error ? "border-red-500" : "border-[#E9EFF5]";
        const disabledClass = disabled ? "opacity-60 pointer-events-none" : "";

        return (
            <div className={`w-full relative ${className}`} ref={containerRef}>
                {label && (
                    <label htmlFor={id || name} className="block text-sm font-semibold text-[#0b1220] mb-2">
                        {label} {required && <span aria-hidden className="text-red-500"> *</span>}
                    </label>
                )}

                <button
                    type="button"
                    id={id || name}
                    ref={(node) => {
                        buttonRef.current = node;
                        if (typeof ref === "function") ref(node);
                        else if (ref) ref.current = node;
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-controls={`${uid}-panel`}
                    aria-label={ariaLabel || label || name}
                    onClick={handleToggle}
                    className={`${baseBtn} ${focusBtn} ${errorClass} ${disabledClass} ${selectClass}`}
                    {...rest}
                >
                    <div className="truncate">
                        {selectedLabel ? <span className="text-sm">{selectedLabel}</span> : <span className="text-sm text-gray-500">{placeholder || "Select..."}</span>}
                    </div>

                    <div className="flex items-center gap-3">
                        {internalValue ? (
                            <span
                                role="button"
                                tabIndex={0}
                                aria-label="Clear"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setInternalValue("");
                                    if (onChange) onChange({ target: { name: name || id, value: "" } });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setInternalValue("");
                                        if (onChange) onChange({ target: { name: name || id, value: "" } });
                                    }
                                }}
                                className="p-1 rounded hover:bg-gray-100 cursor-pointer select-none"
                            >
                                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="none">
                                    <path d="M6 6l8 8M14 6L6 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        ) : null}

                        <svg className={`w-4 h-4 text-[#7C3AED] transform ${open ? "rotate-180" : "rotate-0"} transition`} viewBox="0 0 20 20" fill="none" aria-hidden>
                            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </button>

                {open && (
                    <div
                        id={`${uid}-panel`}
                        role="listbox"
                        aria-labelledby={id || name}
                        className="absolute z-50 mt-2 w-full rounded-xl bg-white/95 text-[#0b1220] shadow-2xl border border-[#E9EFF5] overflow-hidden"
                        style={{ maxHeight: `${maxHeight + 80}px` }}
                    >
                        <div className="p-3 border-b border-[#F1F3F5] bg-white/90">
                            {searchable && (
                                <div className="relative">
                                    <input
                                        ref={searchRef}
                                        type="search"
                                        value={filter}
                                        onChange={(e) => {
                                            setFilter(e.target.value);
                                            setActiveIndex(0);
                                        }}
                                        placeholder="Filter..."
                                        className="block w-full rounded-lg border border-[#E9EFF5] px-3 py-2 text-sm placeholder:text-gray-400 text-[#0b1220] focus:outline-none focus:ring-2 focus:ring-[#996bec]/30 bg-white/95"
                                        aria-label="Filter options"
                                    />
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            className="max-w-full overflow-auto"
                            style={{
                                maxHeight: maxHeight,
                            }}
                        >
                            <ul className="divide-y divide-[#F1F3F5]">
                                {filteredOptions.length === 0 && <li className="px-4 py-3 text-sm text-gray-500">No results</li>}

                                {filteredOptions.map((opt, i) => {
                                    const globalIndex = i;
                                    const isActive = activeIndex === globalIndex;
                                    return (
                                        <li
                                            key={opt.value + "_" + i}
                                            data-opt-index={globalIndex}
                                            role="option"
                                            aria-selected={internalValue === opt.value}
                                            onClick={() => !opt.disabled && selectOption(opt)}
                                            onMouseEnter={() => setActiveIndex(globalIndex)}
                                            className={`px-4 py-2 cursor-pointer select-none text-sm flex items-center justify-between ${opt.disabled ? "opacity-50 cursor-not-allowed text-gray-400" : "text-[#0b1220] hover:bg-violet-50"} ${isActive ? "bg-violet-50" : ""}`}
                                        >
                                            <div className="truncate">{opt.label}</div>
                                            {internalValue === opt.value && (
                                                <svg className="w-4 h-4 text-[#7C3AED]" viewBox="0 0 20 20" fill="none" aria-hidden>
                                                    <path d="M4 10l3 3 9-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {helpText && !error && <div className="px-3 py-2 text-xs text-gray-500">{helpText}</div>}
                    </div>
                )}

                {error && <div className="px-3 py-2 text-xs text-red-600">{error}</div>}
            </div>
        );
    }
);

export default Select;