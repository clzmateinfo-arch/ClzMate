import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BsChevronDown } from "react-icons/bs";
import { HiOutlineCheck, HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import { setCompletedLectures } from "@/entities/course/model/courseSlice";
import { markLectureAsComplete } from "@/entities/course/model/courseDetailsAPI";
import { toast } from "react-hot-toast";

export default function ClassroomSectionSidebar({
    course = {},
    sections = [],
    currentSectionId,
    currentSubId,
    forceVisible = false,
    topic = null,
    onOpenSub = () => { },
}) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = useSelector((s) => s.auth?.token);
    const viewCourseCompleted = useSelector((s) => s.course?.completedLectures || []);
    const [openSection, setOpenSection] = useState(currentSectionId || (sections[0]?._id));
    const [descExpanded, setDescExpanded] = useState(false);
    const [busyToggle, setBusyToggle] = useState(false);

    const effectiveSections = useMemo(() => {
        if (topic && Array.isArray(topic.items)) {
            const subs = topic.items
                .filter((it) => it.type === "subsection")
                .map((it) => ({
                    _id: it._id || it.refId || `${topic._id}:${it.title || ""}`,
                    title: it.title || it.name || (it.raw && it.raw.title) || "Untitled",
                    description: it.description || it.content || "",
                    link: it.link,
                    refId: it.refId,
                    raw: it,
                }));
            return [
                {
                    _id: topic._id || "__topic_section__",
                    sectionName: topic.title || topic.name || "Topic",
                    subSection: subs,
                },
            ];
        }
        return Array.isArray(sections) ? sections : [];
    }, [topic, sections]);

    useEffect(() => {
        setOpenSection(currentSectionId || openSection);
    }, [currentSectionId, currentSubId]);

    const completedSet = useMemo(() => {
        const arr = Array.isArray(viewCourseCompleted) && viewCourseCompleted.length ? viewCourseCompleted : (course?.completedVideos || []);
        return new Set(arr);
    }, [viewCourseCompleted, course?.completedVideos]);

    const flattened = useMemo(() => {
        const arr = [];
        effectiveSections.forEach((s) => {
            (s.subSection || []).forEach((ss) => {
                arr.push({ sectionId: s._id, subId: ss._id, title: ss.title, description: ss.description, raw: ss.raw || ss });
            });
        });
        return arr;
    }, [effectiveSections]);

    const idx = useMemo(() => flattened.findIndex((f) => f.subId === currentSubId), [flattened, currentSubId]);
    const hasPrev = idx > 0;
    const hasNext = idx !== -1 && idx < flattened.length - 1;
    const prevItem = hasPrev ? flattened[idx - 1] : null;
    const nextItem = hasNext ? flattened[idx + 1] : null;

    const handleGotoCourse = useCallback(
        (sId, ssId) => {
            if (!sId || !ssId) return;
            navigate(`/view-course/${course._id}/section/${sId}/sub-section/${ssId}`);
        },
        [navigate, course?._id]
    );

    const currentLecture = useMemo(() => {
        if (!currentSubId) return null;
        for (const s of effectiveSections) {
            const found = (s.subSection || []).find((ss) => ss._id === currentSubId);
            if (found) return { ...found, sectionId: s._id };
        }
        return null;
    }, [effectiveSections, currentSubId]);

    const toggleComplete = useCallback(
        async (lectureId, mark = true) => {
            if (!lectureId || !course?._id) return;
            setBusyToggle(true);

            try {
                const payload = {
                    courseId: course._id,
                    sectionId: currentLecture?.sectionId || null,
                    subSectionId: lectureId,
                    completed: !!mark,
                };

                const ok = await markLectureAsComplete(payload, token);
                if (ok) {
                    const base = Array.isArray(viewCourseCompleted) && viewCourseCompleted.length ? [...viewCourseCompleted] : [...(course?.completedVideos || [])];
                    const set = new Set(base);
                    if (mark) set.add(lectureId);
                    else set.delete(lectureId);
                    const updated = Array.from(set);
                    dispatch(setCompletedLectures(updated));
                    toast.success(mark ? "Marked completed" : "Marked uncompleted");
                } else {
                    toast.error("Could not update completion");
                }
            } catch (err) {
                console.error("toggleComplete error", err);
                toast.error("Network error while updating completion");
            } finally {
                setBusyToggle(false);
            }
        },
        [course?._id, currentLecture?.sectionId, token, dispatch, viewCourseCompleted, course?.completedVideos]
    );

    return (
        <aside
            className={
                forceVisible
                    ? "w-full h-full bg-gradient-to-b from-slate-900/95 to-slate-900/95 p-4 overflow-auto"
                    : "w-full max-w-sm bg-gradient-to-b from-slate-900/80 to-slate-900/70 border-r border-slate-800 h-screen p-4 hidden lg:block"
            }
            aria-label="Course/Topic sections"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                    <h4 className="font-semibold text-lg text-white leading-tight truncate">
                        {topic ? (topic.title || topic.name) : course?.courseName}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                        {!topic && course?.instructor ? `${course?.instructor?.firstName} ${course?.instructor?.lastName}` : ""}
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                {effectiveSections.length === 0 && <div className="text-sm text-slate-400">No sections</div>}
                {effectiveSections.map((s) => {
                    const isOpen = openSection === s._id;
                    return (
                        <div key={s._id} className="group my-2">
                            <button
                                aria-expanded={!!isOpen}
                                onClick={() => setOpenSection(isOpen ? null : s._id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors duration-200
                                ${isOpen ? "bg-indigo-700/40 text-white" : "bg-slate-800/20 text-slate-200 hover:bg-slate-800/30"}`}
                            >
                                <div className="flex items-center gap-3 truncate min-w-0">
                                    <div className="w-9 h-9 flex items-center justify-center rounded-md bg-white/5 text-sm font-semibold">
                                        {s.sectionName ? s.sectionName.charAt(0).toUpperCase() : "S"}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="text-sm font-medium truncate">{s.sectionName}</div>
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
                                    <BsChevronDown className={`${isOpen ? "rotate-0" : "rotate-180"} transition-transform duration-200`} />
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
                                                onClick={() => {
                                                    if (topic) {
                                                        onOpenSub && onOpenSub(ss.raw || ss);
                                                    } else {
                                                        handleGotoCourse(s._id, ss._id);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        if (topic) onOpenSub && onOpenSub(ss.raw || ss);
                                                        else handleGotoCourse(s._id, ss._id);
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
                                                    <div className="text-xs text-slate-400 truncate mt-0.5">{ss.description ? ss.description.slice(0, 80) : ""}</div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-2">
                                                    <div className="text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">Open</div>
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

            {currentLecture && (
                <div className="mt-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <div>
                        <div className="text-sm font-semibold text-white truncate">{currentLecture.title}</div>
                        <div className="text-xs text-slate-400 mt-1">
                            {currentLecture.timeDuration ? `${Math.round(currentLecture.timeDuration / 60)} min` : ""}
                        </div>
                    </div>

                    <div className="mt-3 text-sm text-slate-200">
                        <div className={`prose prose-invert max-w-none text-sm ${descExpanded ? "max-h-[48vh] overflow-auto" : "max-h-[6rem] overflow-hidden"} transition-all`}>
                            {currentLecture.description || <span className="text-slate-500 italic">No description provided.</span>}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                            <button
                                onClick={() => setDescExpanded((s) => !s)}
                                className="px-3 h-9 rounded bg-white/6 text-sm text-white hover:bg-white/10"
                                aria-expanded={descExpanded}
                            >
                                {descExpanded ? "Collapse" : "Read more"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-3">
                        <button
                            onClick={() => toggleComplete(currentLecture._id, !completedSet.has(currentLecture._id))}
                            disabled={busyToggle}
                            className={`w-full h-11 flex items-center justify-center gap-2 rounded ${completedSet.has(currentLecture._id) ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"} text-white`}
                            title={completedSet.has(currentLecture._id) ? "Mark uncompleted" : "Mark completed"}
                        >
                            <HiOutlineCheck />
                            <span className="text-sm">{completedSet.has(currentLecture._id) ? "Unmark as completed" : "Mark as completed"}</span>
                        </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                            onClick={() => hasPrev && (topic ? onOpenSub(prevItem.raw || prevItem) : handleGotoCourse(prevItem.sectionId, prevItem.subId))}
                            disabled={!hasPrev}
                            className={`h-10 w-full flex items-center justify-center gap-2 rounded ${hasPrev ? "bg-white/6 hover:bg-white/10" : "opacity-40 cursor-not-allowed"} text-white`}
                        >
                            <HiOutlineChevronLeft />
                            <span className="text-sm">Previous</span>
                        </button>

                        <button
                            onClick={() => hasNext && (topic ? onOpenSub(nextItem.raw || nextItem) : handleGotoCourse(nextItem.sectionId, nextItem.subId))}
                            disabled={!hasNext}
                            className={`h-10 w-full flex items-center justify-center gap-2 rounded ${hasNext ? "bg-white/6 hover:bg-white/10" : "opacity-40 cursor-not-allowed"} text-white`}
                        >
                            <span className="text-sm">Next</span>
                            <HiOutlineChevronRight />
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-auto text-xs text-slate-400 pt-4">
                <p>{(effectiveSections || []).length} sections • {(course?.studentsEnrolled || []).length}</p>
            </div>
        </aside>
    );
}
