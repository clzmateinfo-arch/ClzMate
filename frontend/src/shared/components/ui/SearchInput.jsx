/* eslint-disable react/prop-types */
import React, { useRef, useState } from "react";
import Button from "@/shared/components/ui/Button";

export default function SearchInput({
    onSearch = () => { },
    placeholder = "Search...",
    label = "Search",
    buttonText = "Search",
    className = "",
}) {
    const [value, setValue] = useState("");
    const inputRef = useRef(null);

    const submit = (e) => {
        e?.preventDefault();
        onSearch(value.trim());
    };

    const clear = () => {
        setValue("");
        inputRef.current?.focus();
        onSearch("");
    };

    return (
        <form
            onSubmit={submit}
            className={`mx-auto mt-6 w-full max-w-3xl ${className}`}
            role="search"
            aria-label={label}
        >
            <label htmlFor="generic-search" className="sr-only">
                {label}
            </label>

            <div className="group relative flex items-center gap-3 mr-5 ml-5 bg-white/10 backdrop-blur-md border border-white/8 rounded-full px-3 py-2.5 shadow-sm hover:shadow-md transition-transform duration-200 ease-out transform hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-offset-0 focus-within:ring-indigo-400">
                <div className="flex-none w-9 h-9 grid place-items-center rounded-full bg-white/6 group-focus-within:scale-105 transition-transform duration-150">
                    <svg
                        aria-hidden
                        viewBox="0 0 24 24"
                        className="w-4 h-4 text-white/90"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
                        />
                    </svg>
                </div>

                <input
                    id="generic-search"
                    ref={inputRef}
                    type="search"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base px-2 py-1 mr-5"
                    aria-label={label}
                    autoComplete="off"
                />

                {value ? (
                    <button
                        type="button"
                        onClick={clear}
                        aria-label="Clear search"
                        className="flex-none w-8 h-8 -ml-10 grid place-items-center rounded-full hover:bg-white/8 transition"
                        title="Clear"
                    >
                        <svg
                            viewBox="0 0 20 20"
                            className="w-3.5 h-3.5 text-white/90"
                            fill="currentColor"
                            aria-hidden
                        >
                            <path d="M14.348 5.652a.5.5 0 00-.707 0L10 9.293 6.36 5.652a.5.5 0 10-.707.707L9.293 10l-3.64 3.64a.5.5 0 10.707.707L10 10.707l3.64 3.64a.5.5 0 10.707-.707L10.707 10l3.64-3.64a.5.5 0 000-.708z" />
                        </svg>
                    </button>
                ) : null}

                <Button
                    type="submit"
                    aria-label="Search"
                    style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
                    className="text-sm"
                >
                    {buttonText}
                </Button>
            </div>
        </form>
    );
}
