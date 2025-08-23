/* eslint-disable react/prop-types */
import React, { useMemo, useState, useCallback } from "react";
import { HiOutlineChevronDown } from "react-icons/hi";
import CourseAccordionBar from "@/features/courseDetails/ui/CourseAccordionBar";
import CourseTags from "./CourseTags";

export default function CourseContentPanel({
    sections = [],
    tags = [],
    totalLectures = 0,
    isActive = undefined,
    onToggle = () => { },
    onCollapseAll = undefined,
    className = "",
}) {
    const [localActive, setLocalActive] = useState([]);

    const activeState = Array.isArray(isActive) ? isActive : localActive;

    const sectionCount = Array.isArray(sections) ? sections.length : 0;

    const handleToggle = useCallback(
        (sectionId) => {
            const currentlyOpen = activeState.includes(sectionId);
            const next = currentlyOpen ? activeState.filter((id) => id !== sectionId) : [...activeState, sectionId];
            onToggle(sectionId, next);
            if (!Array.isArray(isActive)) setLocalActive(next);
        },
        [activeState, isActive, onToggle]
    );

    const handleCollapseAll = useCallback(() => {
        onCollapseAll?.();
        if (!Array.isArray(isActive)) setLocalActive([]);
    }, [isActive, onCollapseAll]);

    const summary = useMemo(() => {
        return `${sectionCount} section${sectionCount === 1 ? "" : "s"} • ${totalLectures ?? 0} lecture${totalLectures === 1 ? "" : "s"}`;
    }, [sectionCount, totalLectures]);

    return (
        // full width on mobile, centered with max width on larger screens
        <section
            className={`w-full mx-auto bg-white rounded-2xl border border-[#efe7ff] p-6 shadow-md hover:shadow-2xl overflow-hidden ${className}`}
        >
            <div className="mr-6">
                {/* Tags (keeps full width and spacing consistent) */}
                <div className="w-full mb-6 min-w-0">
                    <CourseTags tags={tags} />
                </div>

                {/* Header: stacks on small screens, inline on md+ */}
                <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                    <h3 className="text-2xl font-semibold text-[#0b1220] min-w-0">Course Content</h3>

                    <div className="flex items-center gap-4 text-sm text-[#6b7280] flex-wrap min-w-0">
                        <span className="whitespace-nowrap">{sectionCount} section{sectionCount === 1 ? "" : "s"}</span>
                        <span className="whitespace-nowrap">{totalLectures ?? 0} lecture{totalLectures === 1 ? "" : "s"}</span>

                        <button
                            type="button"
                            onClick={handleCollapseAll}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/6 text-[#6b7280] hover:bg-white/8 transition text-sm"
                            aria-label="Collapse all sections"
                            title="Collapse all sections"
                        >
                            <HiOutlineChevronDown className="w-4 h-4 transform rotate-180" />
                            <span>Collapse All</span>
                        </button>
                    </div>
                </div>

                {/* Accordion list: ensure each item can grow/shrink inside the panel */}
                <div className="space-y-3">
                    {Array.isArray(sections) && sections.length > 0 ? (
                        sections.map((section, i) => {
                            const id = section._id ?? section.id ?? `section-${i}`;
                            const open = activeState.includes(id);
                            return (
                                <div key={id} className="w-full min-w-0">
                                    <CourseAccordionBar
                                        course={section}
                                        isActive={activeState}
                                        handleActive={() => handleToggle(id)}
                                        open={open}
                                    />
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-sm text-[#6b7280]">No course content available.</div>
                    )}
                </div>
            </div>
        </section>
    );
}
