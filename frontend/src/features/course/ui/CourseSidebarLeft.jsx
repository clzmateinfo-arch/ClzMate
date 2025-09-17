// src/features/course/ui/CourseSidebarLeft.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { setCourseViewSidebar } from "@/entities/ui/sidebarSlice";
import { HiOutlineDocumentText } from "react-icons/hi";
import { BsChevronDown } from "react-icons/bs";

/**
 * Left sidebar:
 * - layout toggles (already in player too)
 * - sections expandable
 * - button to show course details (slides in)
 */
export default function CourseSidebarLeft() {
    const { courseSectionData = [], courseEntireData = {}, completedLectures = [], totalNoOfLectures = 0 } = useSelector((s) => s.course || {});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { sectionId, subSectionId, courseId } = useParams();
    const [openSections, setOpenSections] = useState({});
    const [detailsOpen, setDetailsOpen] = useState(false);
    const loc = useLocation();

    useEffect(() => {
        setOpenSections({});
    }, [loc.pathname]);

    const toggleSection = (id) => setOpenSections(s => ({ ...s, [id]: !s[id] }));

    return (
        <>
            <aside className="w-[320px] max-w-[340px] border-r border-black bg-white/80 p-3 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                        <h2 className="text-lg font-semibold">{courseEntireData?.courseName}</h2>
                        <p className="text-xs text-gray-500">{completedLectures?.length} / {totalNoOfLectures} completed</p>
                    </div>
                    <button onClick={() => setDetailsOpen(true)} className="p-2 rounded bg-violet-600 text-white">
                        <HiOutlineDocumentText />
                    </button>
                </div>

                <div className="overflow-auto flex-1 space-y-2">
                    {courseSectionData?.map((section) => (
                        <div key={section._id} className="border-b pb-2">
                            <div className="flex items-center justify-between cursor-pointer py-2" onClick={() => toggleSection(section._id)}>
                                <div className="font-semibold">{section.sectionName}</div>
                                <div className="text-xs text-gray-500">{section.subSection?.length} lessons</div>
                            </div>
                            {openSections[section._id] && (
                                <div className="mt-1 space-y-1">
                                    {section.subSection?.map((ss) => (
                                        <div key={ss._id} className={`flex items-center gap-2 p-2 rounded ${ss._id === subSectionId ? "bg-yellow-200" : "hover:bg-white/6 cursor-pointer"}`} onClick={() => navigate(`/view-course/${courseId}/section/${section._id}/sub-section/${ss._id}`)}>
                                            <input type="checkbox" checked={completedLectures?.includes(ss._id)} readOnly />
                                            <div className="truncate">{ss.title}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Course details slide-out */}
                {detailsOpen && (
                    <div className="fixed right-6 top-6 w-[460px] h-[80vh] bg-white rounded-xl shadow-lg p-4 overflow-auto z-50">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Course Details</h3>
                            <button onClick={() => setDetailsOpen(false)} className="text-sm text-gray-600">Close</button>
                        </div>
                        <div className="mt-3 text-sm text-gray-700">
                            <p className="font-medium">{courseEntireData?.courseName}</p>
                            <p className="mt-2">{courseEntireData?.courseDescription}</p>
                            <div className="mt-4">
                                <p className="font-medium">What you'll learn</p>
                                <ul className="list-disc ml-5 mt-2 text-sm">
                                    {(courseEntireData?.whatYouWillLearn || []).map((l, i) => <li key={i}>{l}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
