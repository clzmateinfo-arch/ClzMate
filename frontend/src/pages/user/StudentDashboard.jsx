/* StudentDashboard.jsx
   Student dashboard matching the app theme used in Instructor & EditProfile
*/
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import Img from "@/shared/components/ui/Img";
import Button from "@/shared/components/ui/Button";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

// Replace these with your actual data-fetching functions.
// I kept names aligned with the Instructor example; swap if your API names differ.
//import { fetchEnrolledCourses } from "@/entities/course/model/courseDetailsAPI";
//import { getStudentData } from "@/entities/user/model/userAPI";

export default function StudentDashboard() {
    const { token } = useSelector((s) => s.auth);
    const { user } = useSelector((s) => s.profile);
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    const [studentData, setStudentData] = useState(null); // arbitrary student-metrics
    const [courses, setCourses] = useState([]);

    // fetch data on mount / when location changes (ensures back/forward activates load)
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const sd = []; //await getStudentData(token); // get totals, certificates etc.
                const result = []; //await fetchEnrolledCourses(token); // array of course objects
                if (!mounted) return;
                setStudentData(sd || null);
                setCourses(Array.isArray(result) ? result : []);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error("Student dashboard load failed", err);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [location.pathname, token]);

    // derived stats
    const totalEnrolled = courses.length;
    const completedCount = useMemo(
        () => courses.filter((c) => c.progress >= 100).length,
        [courses]
    );
    const avgProgress = useMemo(() => {
        if (!courses.length) return 0;
        const sum = courses.reduce((s, c) => s + (Number(c.progress) || 0), 0);
        return Math.round(sum / courses.length);
    }, [courses]);
    const totalSpent = studentData?.totalSpent ?? 0;
    const certificates = studentData?.certificates ?? 0;

    // skeleton small card
    const SkeletonCard = () => (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm animate-pulse">
            <div className="h-6 w-1/3 rounded bg-gray-200/30" />
            <div className="mt-4 h-40 rounded bg-gray-200/30" />
        </div>
    );

    return (
        <div className="space-y-6">
            <DashboardHeader
                title={`Hi! ${user?.firstName || "Student"}`}
                subtitle="Welcome back"
                background={backImg}
                showSearch={false}
            />
            <div className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
                {loading ? (
                    <div className="grid grid-cols-1 gap-6">
                        <SkeletonCard />
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* top stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-sm">
                                <p className="text-xs text-black/70">Enrolled</p>
                                <p className="text-2xl font-semibold text-black">{totalEnrolled}</p>
                                <p className="text-xs text-black/60 mt-2">Active courses you're learning</p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-sm">
                                <p className="text-xs text-black/70">Completed</p>
                                <p className="text-2xl font-semibold text-black">{completedCount}</p>
                                <p className="text-xs text-black/60 mt-2">Courses you've finished</p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-sm">
                                <p className="text-xs text-black/70">Average Progress</p>
                                <p className="text-2xl font-semibold text-black">{avgProgress}%</p>
                                <p className="text-xs text-black/60 mt-2">Average completion across courses</p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-sm">
                                <p className="text-xs text-black/70">Certificates</p>
                                <p className="text-2xl font-semibold text-black">{certificates}</p>
                                <p className="text-xs text-black/60 mt-2">Earned certificates</p>
                            </div>
                        </div>

                        {/* main grid: progress list + summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                            {/* progress / enrolled list */}
                            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm my-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-black">Learning Progress</h3>
                                    <Link to="/dashboard/my-courses">
                                        <p className="text-xs font-semibold text-yellow-50 hover:underline">View all</p>
                                    </Link>
                                </div>

                                {courses.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <p className="text-sm text-black/70">You aren't enrolled in any courses yet.</p>
                                        <Link to="/courses">
                                            <Button classes="mt-4">Browse courses</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {courses.map((c) => (
                                            <div key={c._id} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b last:border-b-0 pb-3">
                                                <div className="w-full sm:w-56 flex items-center gap-3">
                                                    <div className="w-20 h-12 rounded-md overflow-hidden bg-gray-100">
                                                        <Img src={c.thumbnail} alt={c.courseName} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-black line-clamp-1">{c.courseName}</p>
                                                        <p className="text-xs text-black/60">{c.instructorName || "Instructor"}</p>
                                                    </div>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="w-full bg-white/6 rounded-full h-3 overflow-hidden">
                                                        <div
                                                            className="h-3 rounded-full bg-gradient-to-r from-[#ba7bf0] to-[#5046e4] transition-all"
                                                            style={{ width: `${Math.min(100, Number(c.progress) || 0)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2 text-xs text-black/70">
                                                        <span>{Math.round(Number(c.progress) || 0)}% complete</span>
                                                        <span>{c.studentsEnrolled?.length || 0} students</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* right summary */}
                            <aside className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm my-5">
                                <p className="text-lg font-bold text-black mb-3">Summary</p>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-black/70">Total Spent</p>
                                        <p className="text-xl font-semibold text-black">Rs. {totalSpent ?? 0}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-black/70">Next recommended</p>
                                        <p className="text-sm text-black/80">Based on your progress, try a short project course to solidify skills.</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-black/70">Quick actions</p>
                                        <div className="mt-3 flex flex-col gap-3">
                                            <Link to="/courses">
                                                <Button classes="w-full text-sm" style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.08)" }}>
                                                    Browse Courses
                                                </Button>
                                            </Link>
                                            <Link to="/dashboard/settings">
                                                <Button classes="w-full text-sm" variant="ghost">
                                                    Account Settings
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        {/* enrolled preview cards */}
                        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-lg font-bold text-black">Enrolled Courses</p>
                                <Link to="/dashboard/my-courses">
                                    <p className="text-xs font-semibold text-yellow-50 hover:underline">View all</p>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {courses.slice(0, 3).map((course) => (
                                    <article key={course._id} className="flex flex-col rounded-lg overflow-hidden">
                                        <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100">
                                            <Img src={course.thumbnail} alt={course.courseName} className="h-full w-full object-cover" />
                                        </div>

                                        <div className="mt-3">
                                            <p className="text-sm font-medium text-black line-clamp-2">{course.courseName}</p>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-black/80">
                                                <span>{Math.round(Number(course.progress) || 0)}% progress</span>
                                                <span>•</span>
                                                <span>{course.instructorName || "Instructor"}</span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
