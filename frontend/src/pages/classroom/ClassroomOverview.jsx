// frontend/src/pages/classroom/ClassroomOverview.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { apiConnector } from "@/shared/services/api/apiConnector";

import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import Loading from "@/shared/components/navigation/Loading";
import IconBtn from "@/shared/components/ui/IconBtn";
import Button from "@/shared/components/ui/Button";

import AnnouncementList from "@/features/classroom/ui/AnnouncementList";
import AnnouncementEditor from "@/features/classroom/ui/AnnouncementEditor";
import {
    fetchClassOverviewAPI,
    createAnnouncementAPI,
    listAnnouncementsAPI,
} from "@/entities/classroom/model/classroomAPI";

import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

import {
    FiChevronLeft,
    FiChevronRight,
    FiEye,
    FiCheck,
    FiExternalLink,
    FiCalendar,
} from "react-icons/fi";

export default function ClassroomOverview() {
    const { classroomId } = useParams(); // route uses :classroomId
    const navigate = useNavigate();
    const { token } = useSelector((s) => s.auth || {});
    const { user } = useSelector((s) => s.profile || {});

    const [loading, setLoading] = useState(false);
    const [classroom, setClassroom] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [showEditor, setShowEditor] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Track "completed" state locally (UI only)
    const [completed, setCompleted] = useState(new Set());

    const upcomingRef = useRef(null);

    const isInstructor =
        (user?.accountType || "").toLowerCase() === "instructor" ||
        user?.isInstructor ||
        user?.role === "instructor";

    const loadOverview = useCallback(async () => {
        if (!classroomId) return;
        setLoading(true);
        try {
            const data = await fetchClassOverviewAPI(classroomId, token);
            if (data) {
                setClassroom(data.classroom || null);
                setAnnouncements(data.announcements || []);
                setUpcoming(data.upcomingAssignments || data.upcoming || []);
            } else {
                setClassroom(null);
                setAnnouncements([]);
                setUpcoming([]);
            }
        } catch (err) {
            console.warn("getClassOverview failed, falling back to announcements only", err);
            try {
                const anns = await listAnnouncementsAPI(classroomId, token);
                setAnnouncements(anns || []);
            } catch (e) {
                console.warn("listAnnouncements fallback failed", e);
                setAnnouncements([]);
            }

            try {
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const resp = await apiConnector("GET", `/api/classroom/${classroomId}`, null, headers);
                if (resp?.data?.success) {
                    setClassroom(resp.data.data || resp.data || null);
                } else {
                    setClassroom(null);
                }
            } catch (e) {
                setClassroom(null);
            }
        } finally {
            setLoading(false);
        }
    }, [classroomId, token]);

    useEffect(() => {
        loadOverview();
    }, [loadOverview, refreshKey]);

    const handleCreateAnnouncement = async (payload) => {
        if (!isInstructor) {
            toast.error("Only instructors can create announcements");
            return;
        }
        try {
            await createAnnouncementAPI(classroomId, payload, token);
            toast.success("Announcement created");
            setShowEditor(false);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            console.error("createAnnouncement error", err);
            toast.error("Failed to create announcement");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent text-richblack-900">
                <Loading />
            </div>
        );
    }

    const membersCount = (classroom?.members || []).length;
    const coTeachers = (classroom?.coInstructors || classroom?.coTeachers || []).length;
    const guests = (classroom?.guests || []).length;
    const updatedAt = classroom?.meta?.updatedAt || classroom?.meta?.createdAt || classroom?.updatedAt || null;

    // ----- Upcoming interaction helpers -----
    const scrollUpcoming = (dir = "right") => {
        const el = upcomingRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.6;
        if (dir === "left") el.scrollBy({ left: -amount, behavior: "smooth" });
        else el.scrollBy({ left: amount, behavior: "smooth" });
    };

    const handleViewActivity = (a) => {
        // route to classwork and focus on item id (UI should handle highlighting)
        if (!a || !a._id) {
            toast("No activity id available");
            return;
        }

        // Try to guess type and route:
        // assignments => /classroom/:id/classwork/assignment/:id
        // quizzes => /classroom/:id/classwork/quiz/:id
        // fallback: open classwork list with focus query param
        const type = (a.type || a.__kind || "").toLowerCase();
        if (type === "assignment" || a.assigneeType || a.points) {
            return navigate(`/classroom/${classroomId}/classwork/assignment/${a._id}`);
        }
        if (type === "quiz" || a.timeLimit) {
            return navigate(`/classroom/${classroomId}/classwork/quiz/${a._id}`);
        }
        // fallback: open classwork page and include focus
        navigate(`/classroom/${classroomId}/classwork?focus=${a._id}`);
    };

    const handleOpenRaw = (a) => {
        // if activity has a reference link
        if (a.references || a.link) {
            const url = a.references || a.link;
            window.open(url, "_blank", "noopener");
        } else if (a.attachments && a.attachments[0]?.url) {
            window.open(a.attachments[0].url, "_blank", "noopener");
        } else {
            toast("No external link found for this activity");
        }
    };

    const toggleCompleted = (a) => {
        if (!a || !a._id) return;
        setCompleted((prev) => {
            const next = new Set(prev);
            const key = String(a._id);
            if (next.has(key)) {
                next.delete(key);
                toast.success("Marked as not done");
            } else {
                next.add(key);
                toast.success("Marked as done");
            }
            return next;
        });
    };

    // keyboard-friendly card activation
    const onKeyActivate = (e, a) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleViewActivity(a);
        }
    };

    return (
        <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
            <DashboardHeader
                title={classroom?.title || "Classroom"}
                subtitle={classroom?.description || ""}
                background={backImg}
                showSearch={false}
            />

            <main className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[85%] lg:max-w-[90%] md:max-w-[95%] sm:max-w-[100%]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <aside className="col-span-1 space-y-4">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-800">Overview</h3>
                            <p className="text-sm text-slate-600 mt-2">{classroom?.description || "No description provided."}</p>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                                <div className="bg-slate-50 rounded-md p-3">
                                    <div className="text-xs">Members</div>
                                    <div className="text-lg font-semibold">{membersCount}</div>
                                </div>

                                <div className="bg-slate-50 rounded-md p-3">
                                    <div className="text-xs">Co-teachers</div>
                                    <div className="text-lg font-semibold">{coTeachers}</div>
                                </div>

                                <div className="bg-slate-50 rounded-md p-3">
                                    <div className="text-xs">Guests</div>
                                    <div className="text-lg font-semibold">{guests}</div>
                                </div>

                                <div className="bg-slate-50 rounded-md p-3">
                                    <div className="text-xs">Updated</div>
                                    <div className="text-sm">{updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-3">
                                <IconBtn onClick={() => navigate(`/classroom/${classroomId}/view`)} className="!px-3 !py-2 bg-violet-600 text-white">
                                    View Classwork
                                </IconBtn>
                                {isInstructor && <IconBtn textClass="text-black" onClick={() => navigate(`/classroom/${classroomId}/members`)} className="bg-slate-100">
                                    Members
                                </IconBtn>}
                            </div>
                        </div>

                        {isInstructor && <div className=" mt-3 mb-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                            <h4 className="text-sm font-semibold text-slate-800">Quick actions</h4>
                            <div className="mt-3 flex flex-col gap-2">
                                <Button onClick={() => setShowEditor(true)} className="px-4 py-2">
                                    New announcement
                                </Button>
                                <Button variant="light" onClick={() => navigate(`/classroom/${classroomId}/classwork`)} className="px-4 py-2">
                                    Create assignment
                                </Button>
                            </div>
                        </div>}
                    </aside>

                    <section className="col-span-1 lg:col-span-2 space-y-4">
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-800">Announcements</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-slate-500">{announcements.length} items</div>
                                    {isInstructor && (
                                        <Button onClick={() => setShowEditor(true)} className="px-3 py-1 text-sm">
                                            + New
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 mb-1">
                                <AnnouncementList
                                    items={announcements}
                                    onView={(a) => navigate(`/classroom/${classroomId}/announcements/${a._id}`)}
                                    showCreate={isInstructor}
                                    onCreate={() => setShowEditor(true)}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mt-1 mb-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <FiCalendar /> Upcoming
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="text-sm text-slate-500">{upcoming.length}</div>
                                    <div className="inline-flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => scrollUpcoming("left")}
                                            aria-label="Scroll left"
                                            className="p-2 rounded-md hover:bg-slate-100"
                                        >
                                            <FiChevronLeft />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => scrollUpcoming("right")}
                                            aria-label="Scroll right"
                                            className="p-2 rounded-md hover:bg-slate-100"
                                        >
                                            <FiChevronRight />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                {upcoming.length === 0 ? (
                                    <div className="text-sm text-slate-500">No upcoming activities</div>
                                ) : (
                                    <div className="relative">
                                        <div
                                            ref={upcomingRef}
                                            className="flex gap-4 overflow-x-auto py-2 px-1 no-scrollbar"
                                            role="list"
                                        >
                                            {upcoming.map((u) => {
                                                const idKey = u._id || u.id || Math.random().toString(36).slice(2, 9);
                                                const done = completed.has(String(u._id));
                                                const when = u.dueDate || u.when || u.due || u.createdAt || null;
                                                const dateLabel = when ? new Date(when).toLocaleString() : null;

                                                return (
                                                    <article
                                                        key={idKey}
                                                        role="listitem"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => onKeyActivate(e, u)}
                                                        onDoubleClick={() => handleViewActivity(u)}
                                                        className={`group relative w-72 min-w-[18rem] bg-white rounded-lg border border-slate-100 p-4 shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-1 focus:translate-y-0 focus:shadow-md outline-none`}
                                                        aria-label={u.title || "Upcoming activity"}
                                                    >
                                                        {/* top row */}
                                                        <div className="flex items-start gap-3">
                                                            <div className={`flex items-center justify-center w-10 h-10 rounded-md ${done ? "bg-green-50" : "bg-indigo-50"}`}>
                                                                <div className={`text-sm font-semibold ${done ? "text-green-700" : "text-indigo-700"}`}>{(u.title || "A").slice(0, 2).toUpperCase()}</div>
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className={`text-sm font-medium ${done ? "text-slate-500 line-through" : "text-slate-800"} truncate`}>{u.title || "Activity"}</div>
                                                                <div className="text-xs text-slate-500 truncate">{u.description || u.summary || ""}</div>
                                                            </div>
                                                        </div>

                                                        {/* footer row */}
                                                        <div className="mt-3 flex items-center justify-between gap-3">
                                                            <div className="text-xs text-slate-600">{dateLabel || "\u00A0"}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${done ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>{done ? "Done" : (u.publish || u.published ? "Published" : "Pending")}</span>
                                                            </div>
                                                        </div>

                                                        {/* hover overlay actions */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-white/0 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none">
                                                            {/* overlay content bottom aligned */}
                                                            <div className="absolute left-0 right-0 bottom-3 px-4 flex items-center justify-between pointer-events-auto">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleViewActivity(u); }}
                                                                        title="View"
                                                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm hover:shadow-md text-sm"
                                                                    >
                                                                        <FiEye /> View
                                                                    </button>

                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenRaw(u); }}
                                                                        title="Open"
                                                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm hover:shadow-md text-sm"
                                                                    >
                                                                        <FiExternalLink /> Open
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); toggleCompleted(u); }}
                                                                        title={done ? "Mark as not done" : "Mark as done"}
                                                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm ${done ? "bg-white border border-slate-200" : "bg-indigo-600 text-white"}`}
                                                                    >
                                                                        <FiCheck /> {done ? "Undo" : "Done"}
                                                                    </button>

                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); navigate(`/classroom/${classroomId}/classwork?focus=${u._id}`); }}
                                                                        title="Go to classwork"
                                                                        className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white border border-slate-200 text-sm hover:shadow-sm"
                                                                    >
                                                                        <FiChevronRight />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {showEditor && (
                <AnnouncementEditor
                    onClose={() => setShowEditor(false)}
                    onCreate={handleCreateAnnouncement}
                    defaultClassroomId={classroomId}
                    disabled={!isInstructor}
                />
            )}
        </div>
    );
}
