import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { IoMdArrowDropdown } from "react-icons/io";
import Button from "@/shared/components/ui/Button";
import { toast } from "react-hot-toast";
import Loading from "@/shared/components/navigation/Loading";
import { getFullDetailsOfCourse } from "@/entities/course/model/courseDetailsAPI";
import { setLinkCourse, setStep } from "@/entities/classroom/model/classroomSlice";
import { createItemAPI } from "@/entities/classroom/model/classroomAPI";

function toStrId(v) {
    if (v === undefined || v === null) return null;
    return String(v);
}

function extractCourseFromFullRaw(fullRaw) {
    if (!fullRaw) return null;

    if (fullRaw.data && fullRaw.data.courseDetails) {
        return fullRaw.data.courseDetails;
    }
    if (fullRaw.courseDetails) {
        return fullRaw.courseDetails;
    }
    if (fullRaw.data && typeof fullRaw.data === "object" && (fullRaw.data.courseContent || fullRaw.data.courseName || fullRaw.data.title)) {
        return fullRaw.data;
    }
    if (fullRaw.courseContent || fullRaw.courseName || fullRaw.title) {
        return fullRaw;
    }
    return null;
}

function normalizeCourse(rawCourse) {
    const c = rawCourse || {};
    const id = c._id ?? c.id ?? c.courseId ?? null;
    const title = c.courseName ?? c.title ?? c.name ?? c.courseTitle ?? "";
    const description = c.courseDescription ?? c.description ?? c.summary ?? "";
    const rawContent = c.courseContent ?? c.content ?? c.sections ?? [];

    const courseContent = Array.isArray(rawContent)
        ? rawContent.map((sec, idx) => {
            const secId = sec._id ?? sec.id ?? `sec-${idx}`;
            const sectionName = sec.sectionName ?? sec.title ?? sec.name ?? `Section ${idx + 1}`;
            const rawSubs = sec.subSection ?? sec.subSections ?? sec.lectures ?? sec.items ?? [];
            const subSection = Array.isArray(rawSubs)
                ? rawSubs.map((sub, sidx) => ({
                    _id: sub._id ?? sub.id ?? toStrId(sub.refId) ?? `sub-${sidx}-${secId}`,
                    title: sub.title ?? sub.name ?? sub.subtitle ?? sub.lectureTitle ?? "Lecture",
                    description: sub.description ?? sub.summary ?? sub.shortDescription ?? "",
                }))
                : [];
            return { _id: secId, sectionName, subSection };
        })
        : [];

    return { _id: id, title, description, courseContent };
}

function SectionItem({ section, isOpen, onToggle, selected, toggleSub }) {
    const contentRef = useRef(null);
    const [height, setHeight] = useState(0);

    React.useEffect(() => {
        if (!contentRef.current) return;
        const target = isOpen ? contentRef.current.scrollHeight : 0;
        requestAnimationFrame(() => setHeight(target));
    }, [isOpen, section]);

    return (
        <div className="overflow-hidden rounded-2xl border border-[#efe7ff] bg-white shadow-sm transition my-3">
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none transition hover:bg-[#f8f7ff]"
                onClick={() => onToggle(section._id)}
                role="button"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}>
                        <IoMdArrowDropdown size={18} className="text-[#7c3aed]" />
                    </span>

                    <p className="font-semibold text-[#0b1220] min-w-0 truncate">{section.sectionName}</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-[#f3f0ff] text-[#6b4dff] text-xs font-medium">
                        <span>{(section.subSection || []).length}</span>
                        <span className="text-xs text-[#6b7280]">lecture(s)</span>
                    </div>
                </div>
            </div>

            <div ref={contentRef} className="overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ height }} aria-hidden={!isOpen}>
                <div className="px-4 py-3 space-y-3 bg-white/50 border-t border-[#f3eff9]/30">
                    {Array.isArray(section.subSection) && section.subSection.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {section.subSection.map((sub) => {
                                const sid = String(sub._id);
                                const checked = selected.includes(sid);
                                return (
                                    <label
                                        key={sid}
                                        className={`cursor-pointer p-3 rounded border flex items-start gap-3 ${checked ? "border-violet-500 bg-violet-50" : "border-[#efe7ff]"}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSub(e, sid);
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => toggleSub(e, sid)}
                                            className="mt-1"
                                            aria-label={`Select subsection ${sub.title}`}
                                        />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">{sub.title}</div>
                                            {sub.description ? <div className="text-xs text-slate-500 mt-1 line-clamp-2">{sub.description}</div> : null}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-sm text-[#6b7280]">No lectures available in this section.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LinkCourseSectionPicker({ classroomId, topicId }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useSelector((s) => s.auth || {});
    const { linkCourse = {} } = useSelector((s) => s.classroom || {});
    const [loading, setLoading] = useState(false);
    const [course, setCourse] = useState(null);
    const [selected, setSelected] = useState([]);
    const [openSections, setOpenSections] = useState([]);

    useEffect(() => {
        (async () => {
            const courseId =
                linkCourse?.courseId ??
                linkCourse?.course?._id ??
                linkCourse?.course?.id ??
                linkCourse?.preview?._id ??
                linkCourse?.preview?.id ??
                null;

            if (!linkCourse || !courseId) {
                toast.error("No course selected. Go back and pick a course.");
                return;
            }

            setLoading(true);
            try {
                const fullRaw = await getFullDetailsOfCourse(courseId, token);
                const extracted = extractCourseFromFullRaw(fullRaw);
                const normalized = normalizeCourse(extracted || linkCourse.course || linkCourse.preview || null);
                setCourse(normalized);
            } catch (err) {
                console.error("Failed to fetch course details", err);
                toast.error("Failed to load course details. Falling back to preview if available.");
                const normalized = normalizeCourse(linkCourse.course || linkCourse.preview || null);
                setCourse(normalized);
            } finally {
                setLoading(false);
            }
        })();
    }, [linkCourse, token]);

    if (loading) return <Loading />;
    if (!course) return <div className="text-sm text-slate-500">No course details available.</div>;

    const toggleSub = (e, subId) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setSelected((prev) => (prev.includes(subId) ? prev.filter((x) => x !== subId) : [...prev, subId]));
    };

    const handleBack = () => dispatch(setStep(2));

    const handleCreateItems = async (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!topicId) {
            toast.error("Missing topic context.");
            return;
        }
        if (!selected.length) {
            toast.error("Select at least one subsection.");
            return;
        }

        setLoading(true);
        try {
            const createdItems = [];
            for (const subId of selected) {
                let found = null;
                let sec = null;
                for (const s of (course.courseContent || [])) {
                    const sub = (s.subSection || []).find((ss) => String(ss._id) === String(subId));
                    if (sub) {
                        found = sub;
                        sec = s;
                        break;
                    }
                }

                const title = found?.title || `Linked lecture`;
                const content = found?.description || "";
                const sectionId = sec?._id || sec?.id;
                const courseId = course._id;
                const payload = {
                    type: "subsection",
                    title,
                    content,
                    refId: subId,
                    link: `/view-course/${courseId}/section/${sectionId}/sub-section/${subId}`,
                };

                const created = await createItemAPI(topicId, payload, token);
                createdItems.push(created);
            }

            dispatch(setLinkCourse({ ...linkCourse, createdCount: createdItems.length }));
            toast.success(`Created ${createdItems.length} item(s)`);
            navigate(`/classroom/${classroomId}/classwork`);
        } catch (err) {
            console.error("Failed to create items for subsections", err);
            toast.error(err?.message || "Failed to link subsections");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSection = (sectionId) => {
        setOpenSections((prev) => (prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]));
    };

    return (
        <div className="rounded-2xl border border-white/8 bg-white p-6 max-w-4xl mx-auto shadow-sm">
            <div>
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{course.description}</p>
            </div>

            <div className="mt-4">
                {Array.isArray(course.courseContent) && course.courseContent.length > 0 ? (
                    course.courseContent.map((section, idx) => {
                        const sid = section._id ?? `section-${idx}`;
                        const open = openSections.includes(sid);
                        return (
                            <SectionItem
                                key={sid}
                                section={section}
                                isOpen={open}
                                onToggle={() => handleToggleSection(sid)}
                                selected={selected}
                                toggleSub={toggleSub}
                            />
                        );
                    })
                ) : (
                    <div className="text-sm text-slate-500">No sections / subsections found for this course.</div>
                )}
            </div>

            <div className="flex justify-between items-center gap-3 mt-6">
                <div className="text-sm text-slate-600">{selected.length > 0 ? <span>{selected.length} selected</span> : <span>No subsections selected</span>}</div>

                <div className="flex gap-3">
                    <Button type="button" variant="light" onClick={handleBack}>Back</Button>
                    <Button type="button" onClick={handleCreateItems} disabled={loading || selected.length === 0}>
                        {loading ? "Linking..." : `Create ${selected.length} item(s)`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
