import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Loading from "@/shared/components/navigation/Loading";
import { fetchMyEnrollmentRequests } from "@/entities/course/model/courseDetailsAPI";
import Button from "@/shared/components/ui/Button";
import Img from "@/shared/components/ui/Img";
import { Link, useNavigate } from "react-router-dom";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

export default function PendingEnrollments() {
    const { token } = useSelector((s) => s.auth || {});
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchMyEnrollmentRequests(token);
                if (!mounted) return;
                if (res?.success) {
                    setRequests(res.data?.requests || res.data || []);
                } else {
                    console.error("Failed to fetch my requests", res);
                }
            } catch (err) {
                console.error("Failed to fetch my requests", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [token]);

    const safe = (v, fallback = "-") => (v === undefined || v === null || v === "" ? fallback : v);

    if (loading) return <Loading />;

    return (
        <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
            <DashboardHeader
                title="Pending Enrollments"
                subtitle="Your enrollment requests and their current status"
                background={backImg}
                showSearch={false}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="mx-auto w-11/12 max-w-maxContent mt-2 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
                    {requests.length === 0 ? (
                        <div className="space-y-2 items-start min-h-[220px] shadow-md rounded-lg border border-white/8 bg-white/6 p-6">
                            <div className="text-sm text-black/70">
                                You have no enrollment requests right now.
                            </div>
                            <div className="mt-4">
                                <Button onClick={() => navigate("/dashboard/enrolled-courses")} className="w-xs">Go to Enrolled Courses</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 shadow-md rounded-lg border border-white/8 bg-white/6 px-4 py-4">
                            {requests.map((r, idx) => {
                                const course = r.course || {};
                                return (
                                    <article
                                        key={r._id ?? idx}
                                        className="flex flex-col sm:flex-row sm:items-center border-b border-b-fuchsia-100 last:border-b-0 px-2 py-3 transition-all hover:shadow-xs"
                                        onClick={() => navigate(`/courses/${course._id}`)}
                                    >
                                        <div
                                            role="link"
                                            tabIndex={0}
                                            onClick={() => navigate(`/courses/${course._id}`)}
                                            className="flex items-start gap-4 w-full sm:w-2/5 cursor-pointer"
                                            aria-label={`Open ${course?.courseName || "course"}`}
                                        >
                                            <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0">
                                                <Img src={course?.thumbnail} alt={course?.courseName || "Course image"} className="h-full w-full object-cover" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold text-richblack-900 truncate">{safe(course?.courseName, "Untitled Course")}</p>
                                                <p className="text-xs text-richblack-400 mt-1 line-clamp-2">{safe(course?.courseDescription, "")}</p>
                                            </div>
                                        </div>

                                        <div className="hidden sm:flex items-center justify-center w-1/4 px-2 text-sm text-richblack-600">
                                            <div className="text-sm">{safe(course?.totalDuration, " ")}</div>
                                        </div>

                                        <div className="w-full sm:flex-1 px-2 mt-3 sm:mt-0 flex items-center justify-between gap-3">
                                            <div className="text-xs text-richblack-600">
                                                <div className="mb-1">Requested: <span className="font-medium text-black">{new Date(r.requestedAt).toLocaleString()}</span></div>
                                                <div>Status: <span className={`font-semibold ${r.status === "Approved" ? "text-green-600" : r.status === "Rejected" ? "text-red-600" : "text-yellow-600"}`}>{r.status}</span></div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
