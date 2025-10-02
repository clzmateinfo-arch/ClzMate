/* eslint-disable react/prop-types */
import React from "react";
import { FaCheck } from "react-icons/fa";


export default function StepCard({ id, title, short, desc, icon, state = "future", compact = false }) {
    const isDone = state === "done";
    const isActive = state === "active";

    return (
        <div
            className={`relative rounded-2xl border p-4 md:p-5 bg-white/6 border-white/8 transition-shadow ${isActive ? "shadow-lg ring-1 ring-[#7C3AED]/10" : "hover:shadow-sm"}`}
            aria-current={isActive ? "step" : undefined}
        >
            <div className="grid grid-cols-[64px_1fr] gap-4 items-start md:items-center">
                <div className="flex items-center justify-center">
                    <div
                        className={`grid place-items-center rounded-full w-14 h-14 text-lg font-semibold transition-colors
                        ${isDone ? "bg-green-300 text-black border border-yellow-50" : ""}
                        ${isActive && !isDone ? "bg-violet-600 text-white" : ""}
                        ${!isActive && !isDone ? "bg-gray-200/60 text-richblack-600 border border-white/8" : ""}`}
                    >
                        {isDone ? <FaCheck className="w-4 h-4" /> : id}
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute right-0 top-0 -translate-y-1/2 hidden md:flex items-center">
                        {isDone ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-green-300 text-black border border-yellow-50">
                                <FaCheck className="w-3 h-3" /> Done
                            </span>
                        ) : isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100">
                                Current
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-gray-200 text-richblack-400 border border-white/8">
                                Locked
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-start md:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <h3 className={`text-sm font-semibold truncate ${isActive ? "text-richblack-900" : "text-richblack-600"}`}>
                                        {title}
                                    </h3>
                                    {/* {!compact && short && (
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-violet-50 text-violet-600" : "bg-white/6 text-richblack-500"} hidden md:inline-block`}
                                        >
                                            {short}
                                        </span>
                                    )} */}
                                </div>
                            </div>

                            <div className="md:hidden">
                                {isDone ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-green-300 text-black border border-yellow-50">
                                        <FaCheck className="w-3 h-3" /> Done
                                    </span>
                                ) : isActive ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100">
                                        Current
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-white/6 text-richblack-400 border border-white/8">
                                        Locked
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className={`mt-1 text-xs text-richblack-600 line-clamp-3`}>
                            {desc}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
