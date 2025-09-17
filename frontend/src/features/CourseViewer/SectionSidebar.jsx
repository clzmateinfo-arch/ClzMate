// src/features/courseViewer/SectionSidebar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsChevronDown } from "react-icons/bs";

export default function SectionSidebar({ course = {}, sections = [], currentSectionId, currentSubId }) {
    const [openSection, setOpenSection] = useState(currentSectionId || (sections[0]?._id));
    const navigate = useNavigate();

    useEffect(() => {
        setOpenSection(currentSectionId || openSection);
    }, [currentSectionId, currentSubId]);

    return (
        <aside className="w-[320px] max-w-sm bg-slate-900/70 border-r border-slate-800 h-screen p-4 hidden lg:block">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-lg">{course?.courseName}</h4>
                    <p className="text-xs text-slate-400">{course?.instructor?.firstName} {course?.instructor?.lastName}</p>
                </div>
            </div>

            <div className="mt-6 overflow-y-auto max-h-[calc(100vh-10rem)] pr-2">
                {sections.map((s) => (
                    <div key={s._id} className="mb-2">
                        <button
                            className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/40 rounded"
                            onClick={() => setOpenSection(openSection === s._id ? null : s._id)}
                        >
                            <div className="text-sm font-medium">{s.sectionName}</div>
                            <BsChevronDown className={`${openSection === s._id ? "rotate-0" : "rotate-180"}`} />
                        </button>

                        {openSection === s._id && (
                            <div className="mt-2 ml-2 space-y-1">
                                {(s.subSection || []).map((ss) => (
                                    <button
                                        key={ss._id}
                                        onClick={() => navigate(`/viewer/${course._id}/section/${s._id}/sub-section/${ss._id}`)}
                                        className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${currentSubId === ss._id ? "bg-indigo-600 text-white" : "hover:bg-slate-800/40"}`}
                                    >
                                        <input type="checkbox" checked={(course?.completedVideos || []).includes(ss._id)} readOnly className="mr-2" />
                                        <div className="truncate">{ss.title}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-auto text-xs text-slate-500">
                <p>{(course?.courseContent || []).length} sections</p>
            </div>
        </aside>
    );
}
