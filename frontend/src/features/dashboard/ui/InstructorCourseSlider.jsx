import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchInstructorCourses, toggleCoursePublish } from "@/entities/course/model/courseDetailsAPI";
import { useSelector } from "react-redux";
import Loading from "@/shared/components/navigation/Loading";
import IconBtn from "@/shared/components/ui/IconBtn";
import Img from "@/shared/components/ui/Img";
import { RiEditBoxLine } from "react-icons/ri";

export default function InstructorCourseSlider({ searchTerm = "", pageSize = 10 }) {
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const observerRef = useRef(null);
    const sentinelRef = useRef(null);

    useEffect(() => {
        setCourses([]);
        setPage(1);
        setHasMore(true);
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

                if (typeof totalCount === "number") setHasMore(page * pageSize < totalCount);
                else setHasMore(received.length === pageSize);
            } catch (err) {
                console.error("Failed loading instructor courses", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => { mounted = false; };
    }, [page, searchTerm, token, pageSize]);

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && hasMore && !loading) setPage((p) => p + 1);
            },
            { root: null, rootMargin: "200px", threshold: 0.1 }
        );
        const current = sentinelRef.current;
        if (current) observerRef.current.observe(current);
        return () => observerRef.current?.disconnect();
    }, [hasMore, loading]);

    const safe = (v, fallback = "-") => (v === undefined || v === null || v === "" ? fallback : v);

    const handleEdit = (courseId) => navigate(`/dashboard/edit-course/${courseId}`);

    const handleTogglePublish = async (courseId, currentStatus) => {
        try {
            const updated = await toggleCoursePublish(courseId, token, !currentStatus);
            if (updated) {
                const newPublished = updated.published ?? (updated.updatedCourse?.status === "Published");
                setCourses((prev) =>
                    prev.map((c) => (c._id === courseId ? { ...c, published: newPublished, status: updated.updatedCourse?.status ?? c.status } : c))
                );
            }
        } catch (err) {
            console.error("Failed to update publish status", err);
        }
    };

    return (
        <section className="mb-8 rounded-xl">
            <article className="hidden sm:flex flex-row items-center border border-white/8 bg-white/6 px-4 py-3 rounded-lg transition-all shadow-md">
                <div className="flex items-start gap-4 w-2/5">Course</div>
                <div className="flex items-center justify-center w-1/4 px-2 text-sm text-richblack-600">Duration / Price</div>
                <div className="flex-1 px-2 text-sm text-richblack-600">Status / Actions</div>
            </article>

            {loading && courses.length === 0 ? (
                <div className="space-y-3 px-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-lg bg-white/10 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-3 shadow-md rounded-xl border border-white/8 bg-white/6 px-3 py-3">
                    {courses.length > 0 ? (
                        courses.map((course, idx) => (
                            <article key={course._id ?? idx} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-3 px-2 border-b border-b-fuchsia-100 last:border-b-0 transition-all hover:shadow-xs">
                                <div
                                    role="link"
                                    tabIndex={0}
                                    onClick={() => navigate(`/courses/${course._id}`)}
                                    onKeyDown={(e) => { if (e.key === "Enter") navigate(`/courses/${course._id}`); }}
                                    className="flex items-start gap-3 w-full sm:w-2/5 cursor-pointer"
                                    aria-label={`Open ${course?.courseName || "course"}`}
                                >
                                    <div className="h-14 w-14 sm:w-20 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                        <Img src={course.thumbnail} alt={course.courseName} className="h-full w-full object-cover" />
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-sm font-medium text-black line-clamp-1">{safe(course.courseName, "Untitled course")}</h3>
                                        <p className="text-xs text-richblack-600 mt-1 line-clamp-2">{safe(course.courseDescription, "")}</p>
                                        <div className="text-sm font-semibold text-black">{course.status}</div>
                                        <div className="text-xs text-richblack-500">{(course.studentsEnrolled?.length ?? 0) + " students"}</div>
                                    </div>
                                </div>

                                <div className="hidden sm:flex items-center justify-center w-1/4 px-2 text-sm text-richblack-600">
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-semibold text-black">{safe(course.totalDuration, "0m")}</span>
                                        <span className="text-xs text-richblack-600 mt-1">Rs. {safe(course.price, 0)}</span>
                                    </div>
                                </div>

                                <div className="w-full sm:flex-1 px-1 mt-1 sm:mt-0 flex flex-col sm:flex-row sm:items-center justify-end gap-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full sm:w-auto">
                                        <div className="min-w-[120px]">
                                            {course.requiresApproval && (
                                                <div className="w-full sm:w-auto">
                                                    <IconBtn
                                                        text="Requests"
                                                        onclick={() => navigate(`/dashboard/course/${course._id}/requests`)}
                                                        customClasses="bg-amber-500 w-full"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full sm:w-auto">
                                            <IconBtn
                                                text={course.status == "Published" ? "Unpublish" : "Publish"}
                                                customClasses={`w-full sm:w-auto ${course.status == "Published" ? "bg-amber-500" : "bg-green-600"}`}
                                                onClick={() => handleTogglePublish(course._id, course.status == "Published")}
                                            />
                                        </div>

                                        <div className="w-full sm:w-auto">
                                            <IconBtn text="Edit" onclick={() => handleEdit(course._id)} customClasses="bg-violet-600 w-full sm:w-auto">
                                                <RiEditBoxLine />
                                            </IconBtn>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))
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
