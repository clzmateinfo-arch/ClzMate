import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BsChevronDown } from "react-icons/bs";

export default function SectionSidebar({
    course = {},
    sections = [],
    currentSectionId,
    currentSubId,
    forceVisible = false,
}) {
    const [openSection, setOpenSection] = useState(
        currentSectionId || (sections[0]?._id)
    );
    const navigate = useNavigate();

    useEffect(() => {
        setOpenSection(currentSectionId || openSection);
    }, [currentSectionId, currentSubId]);

    const rootClass = forceVisible
        ? "w-full h-full bg-gradient-to-b from-slate-900/95 to-slate-900/95 p-4 overflow-auto"
        : "w-full max-w-sm bg-gradient-to-b from-slate-900/80 to-slate-900/70 border-r border-slate-800 h-screen p-4 hidden lg:block";

    const handleGoto = useCallback(
        (sId, ssId) => {
            navigate(`/view-course/${course._id}/section/${sId}/sub-section/${ssId}`);
        },
        [navigate, course?._id]
    );

    const completedSet = new Set(course?.completedVideos || []);

    return (
        <aside className={rootClass}>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h4 className="font-semibold text-lg text-white leading-tight">
                        {course?.courseName}
                    </h4>
                    <p className="text-xs text-slate-400">
                        {course?.instructor?.firstName} {course?.instructor?.lastName}
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                {sections.map((s) => {
                    const isOpen = openSection === s._id;
                    return (
                        <div key={s._id} className="group">
                            <button
                                aria-expanded={!!isOpen}
                                onClick={() => setOpenSection(isOpen ? null : s._id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors duration-200
                                ${isOpen ? "bg-indigo-700/40 text-white" : "bg-slate-800/20 text-slate-200 hover:bg-slate-800/30"}`}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-md bg-white/5 text-xs font-semibold">
                                        {s.sectionName ? s.sectionName.charAt(0).toUpperCase() : "S"}
                                    </div>
                                    <div className="text-sm font-medium truncate text-left">
                                        {s.sectionName}
                                        <div className="text-xs text-slate-400 mt-0.5">{(s.subSection || []).length} lessons</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider transition-all duration-200
                                        ${isOpen ? "bg-white/10 text-white" : "bg-white/5 text-slate-200 group-hover:bg-indigo-600 group-hover:text-white"}`}
                                    >
                                        {isOpen ? "Open" : "View"}
                                    </div>
                                    <BsChevronDown
                                        className={`${isOpen ? "rotate-0" : "rotate-180"} transition-transform duration-200`}
                                    />
                                </div>
                            </button>

                            {isOpen && (
                                <div className="mt-2 ml-2 space-y-2">
                                    {(s.subSection || []).map((ss, idx) => {
                                        const active = currentSubId === ss._id;
                                        const completed = completedSet.has(ss._id);
                                        return (
                                            <div
                                                key={ss._id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleGoto(s._id, ss._id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        handleGoto(s._id, ss._id);
                                                    }
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition transform duration-150
                                                    ${active ? "bg-gradient-to-r from-[#490f7c] via-[#361375] to-[#1a1364] text-white scale-[1.01]" : "hover:translate-x-1 hover:bg-slate-800/40 text-slate-200"}`}
                                            >
                                                <div
                                                    className={`flex items-center justify-center w-8 h-8 rounded-md text-sm font-semibold
                                                    ${active ? "bg-white/10 text-white" : completed ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-200"}`}
                                                >
                                                    {idx + 1}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="truncate text-sm font-medium">{ss.title}</div>
                                                    <div className="text-xs text-slate-400 truncate mt-0.5">{ss.description?.slice(0, 80)}</div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-2">
                                                    {completed ? (
                                                        <div className="text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">Completed</div>
                                                    ) : (
                                                        <div className="text-xs px-2 py-0.5 rounded-full bg-white/6 text-slate-200">Pending</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-auto text-xs text-slate-400 pt-4">
                <p>{(sections || []).length} sections • {(course?.studentsEnrolled || []).length} students</p>
            </div>
        </aside>
    );
}
