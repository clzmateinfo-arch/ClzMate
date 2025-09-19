/* eslint-disable react/prop-types */
import React, { forwardRef, useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const TextArea = forwardRef(
    (
        {
            id,
            name,
            value,
            onChange,
            placeholder = "",
            label,
            required = false,
            ariaLabel,
            leftIcon = null,
            rightIcon = null,
            helpText,
            error,
            autosize = true,
            rows = 4,
            maxLength,
            className = "",
            inputClass = "",
            ...rest
        },
        ref
    ) => {
        const uid = useId();
        const innerRef = useRef(null);
        const [localValue, setLocalValue] = useState(value ?? "");

        useEffect(() => {
            if (value !== undefined) setLocalValue(value ?? "");
        }, [value, useLocation().pathname]);

        const adjustHeight = () => {
            const el = innerRef.current;
            if (!el || !autosize) return;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
        };

        useEffect(() => {
            adjustHeight();
            const ro = new ResizeObserver(() => adjustHeight());
            if (innerRef.current) ro.observe(innerRef.current);
            return () => ro.disconnect();
        }, [localValue, autosize, useLocation().pathname]);

        const baseTextarea =
            "block w-full rounded-xl border bg-white/95 text-[#0b1220] placeholder:text-gray-400 transition duration-200 shadow-sm";

        const focusClasses = "focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#996bec]/70";
        const errorClasses = error ? "border-red-500 focus:ring-red-400" : "border-[#E9EFF5]";

        const paddingLeft = leftIcon ? "pl-14" : "pl-4";
        const paddingRight = rightIcon ? "pr-12" : "pr-4";

        const displayValue = value !== undefined ? value : localValue;

        const emitChange = (nextValue) => {
            if (typeof onChange === "function") {
                const syntheticEvent = { target: { name: name || id, value: nextValue } };
                onChange(syntheticEvent);
            } else {
                setLocalValue(nextValue);
            }
        };

        const handleChange = (e) => {
            const next = e?.target?.value ?? "";
            emitChange(next);
            if (value === undefined) setLocalValue(next);
        };

        return (
            <div className={`w-full ${className}`}>
                {label && (
                    <label htmlFor={id || name} className="block text-sm font-semibold text-[#0b1220]">
                        {label} {required && <span aria-hidden className="text-red-500"> *</span>}
                    </label>
                )}

                <div className="relative mt-2">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#ba7bf0]/20 to-[#996bec]/10 ring-1 ring-[#996bec]/10 text-[#7C3AED]">
                                {leftIcon}
                            </div>
                        </div>
                    )}

                    <textarea
                        id={id || name}
                        name={name}
                        ref={(node) => {
                            innerRef.current = node;
                            if (typeof ref === "function") ref(node);
                            else if (ref) ref.current = node;
                        }}
                        value={displayValue}
                        onChange={handleChange}
                        placeholder={placeholder}
                        rows={rows}
                        aria-label={ariaLabel || label || name}
                        aria-invalid={!!error}
                        aria-describedby={helpText || error ? `${uid}-help` : undefined}
                        className={`${baseTextarea} ${errorClasses} ${focusClasses} ${paddingLeft} ${paddingRight} py-3 resize-none ${inputClass}`}
                        {...rest}
                    />

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {rightIcon && <span className="text-gray-600">{rightIcon}</span>}
                    </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4">
                    <div className="flex-1">
                        {helpText && !error && (
                            <p id={`${uid}-help`} className="text-sm text-gray-500">
                                {helpText}
                            </p>
                        )}
                        {error && (
                            <p id={`${uid}-help`} className="text-sm text-red-600" role="alert">
                                {error}
                            </p>
                        )}
                    </div>

                    {typeof maxLength === "number" && (
                        <div className="text-sm text-gray-400 whitespace-nowrap">
                            <span>{(displayValue || "").length}</span>/<span>{maxLength}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

export default TextArea;
