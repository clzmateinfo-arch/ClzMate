import React, { useEffect, useRef, useState } from "react";
import CourseGrid from "@/features/courseCatalog/ui/CourseGrid";
import Loading from "@/shared/components/navigation/Loading";
import { fetchCourses } from "@/entities/course/model/courseDetailsAPI";

export default function CourseSlider({
  categoryId,
  initialFeatured = [],
  searchTerm = "",
  filters = {},
  pageSize = 12,
  onAddToCart = () => { },
  onToggleSidebar = () => { },
}) {
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setCourses(initialFeatured ?? []);
    setPage(1);
    setHasMore(true);
    setTotal(null);
  }, [categoryId, initialFeatured]);

  useEffect(() => {
    setCourses([]);
    setPage(1);
    setHasMore(true);
    setTotal(null);
  }, [searchTerm, filters, categoryId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!categoryId) return;
      setLoading(true);
      try {
        const res = await fetchCourses({
          categoryId,
          page,
          limit: pageSize,
          search: searchTerm,
          filters,
        });

        const received =
          res?.data?.data?.courses ??
          res?.data?.data ??
          res?.data?.courses ??
          res?.data ??
          res?.courses ??
          res?.items ??
          res?.data?.items ??
          [];

        const totalCount =
          res?.data?.total ??
          res?.total ??
          res?.data?.data?.total ??
          res?.data?.count ??
          res?.count ??
          null;

        if (!mounted) return;

        if (page === 1) setCourses(received);
        else setCourses((prev) => [...prev, ...received]);

        setTotal(typeof totalCount === "number" ? totalCount : null);

        if (typeof totalCount === "number") {
          setHasMore(page * pageSize < totalCount);
        } else {
          setHasMore(received.length === pageSize);
        }
      } catch (err) {
        console.error("Failed loading courses", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [page, categoryId, searchTerm, filters, pageSize]);

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
      <div className="flex items-center mb-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex items-center gap-2 px-4 py-2 mr-5 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition"
        >
          Filters
          <svg
            viewBox="0 0 20 20"
            className="w-4 h-4"
            fill="currentColor"
            aria-hidden
          >
            <path d="M3 5h14v2l-5 5v3l-4-2v-4L3 7V5z" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold">Courses</h2>
      </div>

      {loading && courses.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl skeleton" />
          ))}
        </div>
      ) : (
        <CourseGrid cards={courses} onAddToCart={onAddToCart} />
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
