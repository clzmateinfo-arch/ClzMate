import React, { useEffect, useRef, useState } from "react";
import { getUserEnrolledCourses } from "@/entities/user/model/userAPI";
import { useSelector } from "react-redux";
import Loading from "@/shared/components/navigation/Loading";
import EnrolledCourseCard from "@/features/dashboard/ui/EnrolledCourseCard";

export default function EnrolledCourseSlider({
    searchTerm = "",
    pageSize = 6,
}) {
    const { token } = useSelector((state) => state.auth);
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

        const load = async () => {
            setLoading(true);
            try {
                const res = await getUserEnrolledCourses({
                    token,
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
                console.error("Failed loading enrolled courses", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

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

    return (
        <section className="mb-8">
            <article className="hidden sm:flex flex-col sm:flex-row sm:items-center border border-white/8 bg-white/6 px-4 py-4 rounded-lg transition-all shadow-md">
                <div className="flex items-start gap-4 w-full sm:w-2/5 cursor-pointer">Course</div>
                <div className="hidden sm:flex items-center justify-center w-1/4 px-2 text-sm text-richblack-600">Duration</div>
                <div className="w-full sm:flex-1 px-2 mt-3 sm:mt-0 text-sm text-richblack-600">Progress</div>
            </article>

            {loading && courses.length === 0 ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-lg bg-white/10 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-2 shadow-md rounded-lg border border-white/8 bg-white/6 px-4 py-4">
                    {courses.map((course, idx, arr) => (
                        <EnrolledCourseCard
                            key={(course._id ?? course.id ?? idx) + "-" + idx}
                            course={course}
                            maxDescriptionLength={90}
                            showDuration={true}
                            className={idx === arr.length - 1 ? "" : ""}
                        />
                    ))}
                </div>
            )}

            <div ref={sentinelRef} className="h-4" />

            {loading && (
                <div className="mt-4 flex justify-center">
                    <Loading />
                </div>
            )}

            {!hasMore && !loading && courses.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                    You have reached the end
                </div>
            )}
        </section>
    );
}
