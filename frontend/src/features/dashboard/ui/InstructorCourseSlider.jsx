import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchInstructorCourses } from "@/entities/course/model/courseDetailsAPI";
import { useSelector } from "react-redux";
import Loading from "@/shared/components/navigation/Loading";
import IconBtn from "@/shared/components/ui/IconBtn";
import Img from "@/shared/components/ui/Img";
import { RiEditBoxLine } from "react-icons/ri";
import { FiTrash2 } from "react-icons/fi";

export default function InstructorCourseSlider({
    searchTerm = "",
    pageSize = 10,
}) {
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(null);

    const observerRef = useRef(null);
    const sentinelRef = useRef(null);

    useEffect(() => {
        setCourses([]);
        setPage(1);
        setHasMore(true);
        setTotal(null);
    }, [searchTerm]);

    useEffect(() => {
        let mounted = true;

        async function load() {
            if (!token) return;
            setLoading(true);
            try {
                const res = await fetchInstructorCourses({
                    token: token,
                    page,
                    limit: pageSize,
                    search: searchTerm,
                });
                const received = res?.data ?? [];
                const totalCount = res?.total ?? null;

                if (!mounted) return;

                if (page === 1) setCourses(received);
                else setCourses((prev) => [...prev, ...received]);

                setTotal(totalCount);

                if (typeof totalCount === "number") {
                    setHasMore(page * pageSize < totalCount);
                } else {
                    setHasMore(received.length === pageSize);
                }
            } catch (err) {
                console.error("Failed loading instructor courses", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => {
            mounted = false;
        };
    }, [page, searchTerm, token, pageSize]);

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && hasMore && !loading) {
                    setPage((p) => p + 1);
                }
            },
            { root: null, rootMargin: "200px", threshold: 0.1 }
        );

        const current = sentinelRef.current;
        if (current) observerRef.current.observe(current);

        return () => observerRef.current?.disconnect();
    }, [hasMore, loading]);

    const safe = (v, fallback = "-") => (v === undefined || v === null || v === "" ? fallback : v);

    const handleEdit = (courseId) => navigate(`/dashboard/edit-course/${courseId}`);
    const handleDelete = (courseId) => {
        console.log("delete course", courseId);
        setCourses((prev) => prev.filter((c) => c._id !== courseId));
    };

    return (
        <section className="mb-8">
            <article className="hidden sm:flex flex-col sm:flex-row sm:items-center border border-white/8 bg-white/6 px-4 py-4 rounded-lg transition-all shadow-md">
                <div className="flex items-start gap-4 w-full sm:w-2/5 cursor-pointer">Course</div>
                <div className="hidden sm:flex items-center justify-center w-1/4 px-2 text-sm text-richblack-600">Duration / Price</div>
                <div className="w-full sm:flex-1 px-2 mt-3 sm:mt-0 text-sm text-richblack-600">Status / Actions</div>
            </article>

            {loading && courses.length === 0 ? (
                <div className="space-y-3 px-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-lg bg-white/10 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-2 shadow-md rounded-lg border border-white/8 bg-white/6 px-4 py-4">
                    {courses.length > 0 ? (
                        <>
                            {courses.map((course, idx) => (
                                <div key={course._id ?? idx} className="py-3 flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3 min-w-0 sm:w-2/5">
                                        <div className="w-20 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                            <Img src={course.thumbnail} alt={course.courseName} className="w-full h-full object-cover" />
                                        </div>

                                        <div className="min-w-0">
                                            <Link to={`/courses/${course._id}`} className="text-sm font-medium text-black line-clamp-1 hover:underline">
                                                {safe(course.courseName, "Untitled course")}
                                            </Link>
                                            <p className="text-xs text-richblack-600 mt-1 line-clamp-2">
                                                {safe(course.courseDescription, "")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center justify-center w-1/4 px-2 text-sm text-richblack-600">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-semibold text-black">{safe(course.totalDuration, "0m")}</span>
                                            <span className="text-xs text-richblack-600 mt-1">Rs. {safe(course.price, 0)}</span>
                                        </div>
                                    </div>
                                    <div className="w-full sm:flex-1 px-2 mt-3 sm:mt-0 flex items-center justify-end gap-3">
                                        <div className="text-xs text-richblack-600 mr-3 text-right">
                                            <div className="text-sm font-semibold text-black">
                                                {course.published ? "Published" : "Draft"}
                                            </div>
                                            <div className="text-xs text-richblack-500">{(course.studentsEnrolled?.length ?? 0) + " students"}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <IconBtn text="Edit" onclick={() => handleEdit(course._id)} customClasses="bg-violet-600">
                                                <RiEditBoxLine />
                                            </IconBtn>

                                            <IconBtn
                                                text="Delete" customClasses="bg-red-500" onClick={() => handleDelete(course._id)}
                                            >
                                                <FiTrash2 />
                                            </IconBtn>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-sm text-black/70">You have not created any courses yet</p>
                        </div>
                    )}
                </div>
            )}

            <div ref={sentinelRef} className="h-4" />

            {loading && courses.length > 0 && (
                <div className="mt-4 flex justify-center">
                    <Loading />
                </div>
            )}

            {!hasMore && !loading && courses.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-500">You have reached the end</div>
            )}
        </section>
    );
}
