import React, { forwardRef, useState, useId } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const Input = forwardRef(
    (
        {
            id,
            name,
            type = "text",
            value,
            onChange,
            placeholder = "",
            label,
            required = false,
            autoFocus = false,
            className = "",
            inputClass = "",
            leftIcon = null,
            rightIcon = null,
            showPasswordToggle = false,
            helpText,
            error,
            ariaLabel,
            ...rest
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === "password";
        const computedType = isPassword && showPassword ? "text" : type;
        const uid = useId();

        const baseInput = "block w-full rounded-xl border bg-white/95 text-[#0b1220] placeholder:text-gray-400 transition duration-200 shadow-sm";
        const focusClasses = "focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#996bec]/70";
        const errorClasses = error ? "border-red-500 focus:ring-red-400" : "border-[#E9EFF5]";

        const paddingLeft = leftIcon ? "pl-14" : "pl-4";
        const paddingRight =
            rightIcon || (showPasswordToggle && isPassword) ? "pr-12" : "pr-4";

        return (
            <div className={`w-full ${className}`}>
                {label && (
                    <label
                        htmlFor={id || name}
                        className="block text-sm font-semibold text-[#0b1220]"
                    >
                        {label}{" "}
                        {required && (
                            <span aria-hidden className="text-red-500">
                                {" "}
                                *
                            </span>
                        )}
                    </label>
                )}

                <div className="relative mt-2">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#ba7bf0]/10 to-[#996bec]/10 ring-1 ring-[#996bec]/10 text-[#7C3AED]">
                                {leftIcon}
                            </div>
                        </div>
                    )}

                    <input
                        id={id || name}
                        name={name}
                        ref={ref}
                        type={computedType}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        autoFocus={autoFocus}
                        aria-label={ariaLabel || label || name}
                        aria-invalid={!!error}
                        aria-describedby={helpText || error ? `${uid}-help` : undefined}
                        className={`${baseInput} ${errorClasses} ${focusClasses} ${paddingLeft} ${paddingRight} py-3 ${inputClass}`}
                        {...rest}
                    />

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        {rightIcon && (
                            <span className="text-gray-600 pointer-events-none">{rightIcon}</span>
                        )}

                        {showPasswordToggle && isPassword && (
                            <button
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowPassword((s) => !s)}
                                className="p-1 rounded text-[#5b21b6] hover:text-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7704ca]/40 pointer-events-auto"
                            >
                                {showPassword ? (
                                    <AiOutlineEyeInvisible className="w-5 h-5" />
                                ) : (
                                    <AiOutlineEye className="w-5 h-5" />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {helpText && !error && (
                    <p id={`${uid}-help`} className="mt-2 text-sm text-gray-500">
                        {helpText}
                    </p>
                )}
                {error && (() => {
                    const errorMsg =
                        typeof error === "string"
                            ? error
                            : error?.message ?? error?.type ?? "Invalid value";
                    return (
                        <p id={`${uid}-help`} className="mt-2 text-sm text-red-600" role="alert">
                            {errorMsg}
                        </p>
                    );
                })()}
            </div>
        );
    }
);

export default Input;
