import { forwardRef, useId } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

const Dateinput = forwardRef(
    (
        {
            id,
            name,
            label,
            value,
            onChange,
            placeholder = "Select a date",
            required = false,
            autoFocus = false,
            className = "",
            inputClass = "",
            minDate,
            maxDate,
            dateFormat = "yyyy-MM-dd",
            showTimeSelect = false,
            timeFormat = "HH:mm",
            timeIntervals = 30,
            error,
            helpText,
            ariaLabel,
            leftIcon = <CalendarDays className="w-5 h-5" />,
            onlyFuture = true,
            ...rest
        },
        ref
    ) => {
        const uid = useId();

        const today = new Date();
        const minSelectableDate = onlyFuture ? today : minDate;

        const baseInput =
            "block w-full rounded-xl border bg-white/95 text-[#0b1220] placeholder:text-gray-400 transition duration-200 shadow-sm";
        const focusClasses =
            "focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#996bec]/70";
        const errorClasses = error
            ? "border-red-500 focus:ring-red-400"
            : "border-[#E9EFF5]";

        const paddingLeft = leftIcon ? "pl-14" : "pl-4";
        const paddingRight = "pr-4";

        return (
            <div className={`w-full ${className}`}>
                {label && (
                    <label
                        htmlFor={id || name}
                        className="block text-sm font-semibold text-[#0b1220]"
                    >
                        {label}{" "}
                        {required && (
                            <span className="text-red-500" aria-hidden>
                                *
                            </span>
                        )}
                    </label>
                )}

                <div className="relative mt-2">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#ba7bf0]/10 to-[#996bec]/10 ring-1 ring-[#996bec]/10 text-[#7C3AED]">
                            {leftIcon}
                        </div>
                    </div>

                    <DatePicker
                        id={id || name}
                        name={name}
                        ref={ref}
                        selected={value ? new Date(value) : null}
                        onChange={(date) =>
                            onChange?.(date ? format(date, dateFormat) : "")
                        }
                        placeholderText={placeholder}
                        dateFormat={dateFormat}
                        showTimeSelect={showTimeSelect}
                        timeFormat={timeFormat}
                        timeIntervals={timeIntervals}
                        minDate={minSelectableDate}
                        maxDate={maxDate}
                        autoFocus={autoFocus}
                        aria-label={ariaLabel || label || name}
                        className={`${baseInput} ${errorClasses} ${focusClasses} ${paddingLeft} ${paddingRight} py-3 ${inputClass}`}
                        {...rest}
                    />
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
                        <p
                            id={`${uid}-help`}
                            className="mt-2 text-sm text-red-600"
                            role="alert"
                        >
                            {errorMsg}
                        </p>
                    );
                })()}
            </div>
        );
    }
);

Dateinput.displayName = "Dateinput";

export default Dateinput;
