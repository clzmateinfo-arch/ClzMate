import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import Loading from "@/shared/components/navigation/Loading";
import IconBtn from "@/shared/components/ui/IconBtn";
import Button from "@/shared/components/ui/Button";

import AnnouncementList from "@/features/classroom/ui/AnnouncementList";
import {
    fetchClassOverviewAPI,
} from "@/entities/classroom/model/classroomAPI";

import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

export default function ClassroomOverview() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { token } = useSelector((s) => s.auth || {});

    const [loading, setLoading] = useState(false);
    const [classroom, setClassroom] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [upcoming, setUpcoming] = useState([]);

    const load = useCallback(async () => {
        if (!classId) return;
        setLoading(true);

        try {
            try {
                const overview = await fetchClassOverviewAPI(classId, token);
                if (overview) {
                    setClassroom(overview.classroom || overview || null);
                    setAnnouncements(overview.announcements || overview.announcementsList || overview.ann || []);
                    setUpcoming(overview.upcoming || overview.upcomingActivities || []);
                }
            } catch (errOverview) {
                console.warn("Overview endpoint failed, falling back to announcements only", errOverview);
                try {
                    const items = [];
                    setAnnouncements(Array.isArray(items) ? items : []);
                } catch (eAnn) {
                    console.warn("listAnnouncementsAPI failed", eAnn);
                    setAnnouncements([]);
                }

                try {
                    const { apiConnector } = require("@/shared/services/api/apiConnector");
                    const headers = token ? { Authorization: `Bearer ${token}` } : {};
                    const resp = await apiConnector("GET", `/api/classroom/${classId}`, null, headers);
                    if (resp?.data?.success) {
                        setClassroom(resp.data.data || resp.data || null);
                    } else {
                        setClassroom(null);
                    }
                } catch (e) {
                    console.warn("Direct classroom fetch fallback failed", e);
                    setClassroom(null);
                }
            }
        } catch (err) {
            console.error("ClassroomOverview load error", err);
            toast.error(err?.message || "Failed to load classroom overview");
        } finally {
            setLoading(false);
        }
    }, [classId, token]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent text-richblack-900">
                <Loading />
            </div>
        );
    }

    const membersCount = (classroom?.members || []).length;
    const coTeachers = (classroom?.coTeachers || []).length;
    const guests = (classroom?.guests || []).length;
    const updatedAt = classroom?.meta?.updatedAt || classroom?.meta?.createdAt || classroom?.updatedAt || null;

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
                        <div className="rounded-2xl border border-white/8 bg-white p-4 shadow-sm">
                            <h3 className="text-lg font-semibold text-richblack-900">Overview</h3>
                            <p className="text-sm text-slate-600 mt-2">{classroom?.description || "No description provided."}</p>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                                <div className="bg-white/6 rounded-md p-3">
                                    <div className="text-xs">Members</div>
                                    <div className="text-lg font-semibold">{membersCount}</div>
                                </div>

                                <div className="bg-white/6 rounded-md p-3">
                                    <div className="text-xs">Co-teachers</div>
                                    <div className="text-lg font-semibold">{coTeachers}</div>
                                </div>

                                <div className="bg-white/6 rounded-md p-3">
                                    <div className="text-xs">Guests</div>
                                    <div className="text-lg font-semibold">{guests}</div>
                                </div>

                                <div className="bg-white/6 rounded-md p-3">
                                    <div className="text-xs">Updated</div>
                                    <div className="text-sm">{updatedAt ? new Date(updatedAt).toLocaleString() : " "}</div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-3">
                                <IconBtn onClick={() => navigate(`/classroom/${classId}/classwork`)} customClasses="bg-violet-600 text-white" className="!px-3 !py-2">
                                    View Classwork
                                </IconBtn>
                                <IconBtn onClick={() => navigate(`/classroom/${classId}/members`)} className="bg-white/6">
                                    Members
                                </IconBtn>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white p-4 shadow-sm">
                            <h4 className="text-sm font-semibold text-richblack-900">Quick actions</h4>
                            <div className="mt-3 flex flex-col gap-2">
                                <Button onClick={() => navigate(`/classroom/${classId}/announcements/new`)} className="px-4 py-2">
                                    New announcement
                                </Button>
                                <Button variant="light" onClick={() => navigate(`/classroom/${classId}/create-assignment`)} className="px-4 py-2">
                                    Create assignment
                                </Button>
                            </div>
                        </div>
                    </aside>

                    <section className="col-span-1 lg:col-span-2 space-y-4">
                        <div className="rounded-2xl border border-white/8 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-richblack-900">Announcements</h3>
                                <div className="text-sm text-slate-500">{announcements.length} items</div>
                            </div>

                            <div className="mt-4">
                                <AnnouncementList
                                    items={announcements}
                                    onView={(a) => navigate(`/classroom/${classId}/announcements/${a._id}`)}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-richblack-900">Upcoming</h3>
                                <div className="text-sm text-slate-500">{upcoming.length}</div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {upcoming.length === 0 ? (
                                    <div className="text-sm text-slate-500">No upcoming activities</div>
                                ) : (
                                    upcoming.map((u) => (
                                        <article key={u._id || u.id} className="rounded-md bg-white/6 p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-richblack-900 truncate">{u.title || "Activity"}</div>
                                                    <div className="text-xs text-slate-500">{u.description}</div>
                                                </div>
                                                <div className="text-xs text-slate-600">{u.when ? new Date(u.when).toLocaleString() : " "}</div>
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
