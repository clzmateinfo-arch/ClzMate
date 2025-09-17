// src/pages/course/CourseViewerPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PlayerPanel from "@/features/courseViewer/PlayerPanel";
import SectionSidebar from "@/features/courseViewer/SectionSidebar";
import NotesPanel from "@/features/courseViewer/NotesPanel";
import SandboxPanel from "@/features/courseViewer/SandboxPanel";
import { getSignedAssetUrl, getFullDetailsOfCourse } from "@/entities/course/model/courseDetailsAPI";
import { setCourseSectionData, setEntireCourseData, setCompletedLectures, setTotalNoOfLectures } from "@/entities/course/model/courseSlice";

export default function CourseViewerPage() {
    const { courseId, sectionId, subSectionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const auth = useSelector((s) => s.auth) || {};
    const token = auth.token;
    // use the same slice shape as your app
    const courseSlice = useSelector((s) => s.course || {});
    const courseSectionData = courseSlice.courseSectionData || [];
    const courseEntireData = courseSlice.courseEntireData || {};
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // fetch full details once when route loads
        (async () => {
            try {
                setLoading(true);
                const data = await getFullDetailsOfCourse(courseId, token);
                if (data) {
                    dispatch(setCourseSectionData(data.courseDetails.courseContent || []));
                    dispatch(setEntireCourseData(data.courseDetails || {}));
                    dispatch(setCompletedLectures(data.completedVideos || []));
                    let lectures = 0;
                    data?.courseDetails?.courseContent?.forEach((s) => { lectures += (s.subSection || []).length; });
                    dispatch(setTotalNoOfLectures(lectures));
                }
            } catch (e) {
                console.error("Course viewer load failed", e);
            } finally { setLoading(false); }
        })();
    }, [courseId, location.pathname]);

    // Derive current subSection object
    const [currentSub, setCurrentSub] = useState(null);
    useEffect(() => {
        if (!courseSectionData.length) { setCurrentSub(null); return; }
        const sec = courseSectionData.find((s) => s._id === sectionId);
        if (!sec) { setCurrentSub(null); return; }
        const sub = (sec.subSection || []).find((ss) => ss._id === subSectionId) || null;
        setCurrentSub(sub);
    }, [courseSectionData, sectionId, subSectionId]);

    // layout state is read from localStorage (persisted) or default "split"
    const [layout, setLayout] = useState(() => localStorage.getItem("viewer-layout") || "split"); // split | focused | stacked | compact
    useEffect(() => { localStorage.setItem("viewer-layout", layout); }, [layout]);

    return (
        <div className="w-full min-h-screen flex">
            {/* Section navigation / course details sidebar (collapsible) */}
            <SectionSidebar course={courseEntireData} sections={courseSectionData} currentSectionId={sectionId} currentSubId={subSectionId} />

            <div className="flex-1 min-h-screen flex flex-col">
                {/* Top controls */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-900 z-20">
                    <div className="flex items-center gap-3">
                        <button className="text-sm px-3 py-1 rounded-md bg-slate-800/60" onClick={() => navigate(-1)}>Back</button>
                        <h2 className="text-lg font-semibold">{courseEntireData?.courseName || "Course"}</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-sm text-slate-400 mr-2">Layout</div>
                        <div className="flex items-center gap-2">
                            <button className={`px-2 py-1 rounded ${layout === "focused" ? "bg-indigo-600" : "bg-slate-800/40"}`} onClick={() => setLayout("focused")}>Focused</button>
                            <button className={`px-2 py-1 rounded ${layout === "split" ? "bg-indigo-600" : "bg-slate-800/40"}`} onClick={() => setLayout("split")}>Split</button>
                            <button className={`px-2 py-1 rounded ${layout === "stacked" ? "bg-indigo-600" : "bg-slate-800/40"}`} onClick={() => setLayout("stacked")}>Stack</button>
                            <button className={`px-2 py-1 rounded ${layout === "compact" ? "bg-indigo-600" : "bg-slate-800/40"}`} onClick={() => setLayout("compact")}>Compact</button>
                        </div>
                    </div>
                </div>

                {/* Main content area */}
                <div className={`flex-1 flex ${layout === "focused" ? "items-center justify-center p-6" : ""} gap-4 px-6 py-6`}>
                    {/* Left: player / pdf */}
                    <div className={`
                        ${layout === "split" ? "w-7/12" : ""}
                        ${layout === "focused" ? "w-full max-w-4xl" : ""}
                        ${layout === "stacked" ? "w-full" : ""}
                        ${layout === "compact" ? "w-2/3" : ""}
                        min-h-[360px]
                    `}>
                        <PlayerPanel
                            sub={currentSub}
                            course={courseEntireData}
                            token={token}
                            onNext={() => {
                                // navigate to next lecture
                                // small helper: find next sub
                                const secIndex = courseSectionData.findIndex(s => s._id === sectionId);
                                if (secIndex === -1) return;
                                const subIndex = (courseSectionData[secIndex]?.subSection || []).findIndex(ss => ss._id === subSectionId);
                                if (subIndex === -1) return;
                                if (subIndex < courseSectionData[secIndex].subSection.length - 1) {
                                    const nextId = courseSectionData[secIndex].subSection[subIndex + 1]._id;
                                    window.location.href = `/viewer/${courseId}/section/${sectionId}/sub-section/${nextId}`;
                                } else {
                                    const nextSection = courseSectionData[secIndex + 1];
                                    if (!nextSection) return;
                                    const nextId = nextSection.subSection[0]._id;
                                    window.location.href = `/viewer/${courseId}/section/${nextSection._id}/sub-section/${nextId}`;
                                }
                            }}
                            onPrev={() => {
                                // navigate prev similar
                                const secIndex = courseSectionData.findIndex(s => s._id === sectionId);
                                if (secIndex === -1) return;
                                const subIndex = (courseSectionData[secIndex]?.subSection || []).findIndex(ss => ss._id === subSectionId);
                                if (subIndex === -1) return;
                                if (subIndex > 0) {
                                    const prevId = courseSectionData[secIndex].subSection[subIndex - 1]._id;
                                    window.location.href = `/viewer/${courseId}/section/${sectionId}/sub-section/${prevId}`;
                                } else {
                                    const prevSection = courseSectionData[secIndex - 1];
                                    if (!prevSection) return;
                                    const prevId = prevSection.subSection[prevSection.subSection.length - 1]._id;
                                    window.location.href = `/viewer/${courseId}/section/${prevSection._id}/sub-section/${prevId}`;
                                }
                            }}
                        />
                    </div>

                    {/* Right: details / notes / sandbox */}
                    <aside className={`
                        ${layout === "split" ? "w-5/12" : ""}
                        ${layout === "focused" ? "hidden lg:block w-1/3" : ""}
                        ${layout === "stacked" ? "w-full" : ""}
                        ${layout === "compact" ? "w-1/3" : ""}
                        flex flex-col gap-4
                    `}>
                        <div className="bg-slate-800/40 rounded-xl p-4">
                            <h3 className="text-lg font-semibold">{currentSub?.title || "Lecture"}</h3>
                            <p className="text-sm text-slate-300 mt-2">{currentSub?.description}</p>
                        </div>

                        <NotesPanel courseId={courseId} sectionId={sectionId} subSectionId={subSectionId} userId={auth?.user?.id} />

                        {/* sandbox only if lecture sets flag */}
                        {currentSub?.supportMaterials?.some(s => s.isSandbox) && (
                            <SandboxPanel language={currentSub?.sandboxLanguage || "javascript"} />
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
