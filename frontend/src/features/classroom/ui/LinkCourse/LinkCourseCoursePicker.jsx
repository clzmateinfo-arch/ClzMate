// frontend/src/features/classroom/ui/LinkCourse/LinkCourseCoursePicker.jsx
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLinkCourse, setStep } from "@/entities/classroom/model/classroomSlice";
import { fetchInstructorCourses } from "@/entities/course/model/courseDetailsAPI";
import Button from "@/shared/components/ui/Button";
import { toast } from "react-hot-toast";
import Loading from "@/shared/components/navigation/Loading";
import { FiSearch } from "react-icons/fi";

const PlaceholderImage = "/placeholder-course.webp";

export default function LinkCourseCoursePicker() {
    const dispatch = useDispatch();
    const { token } = useSelector((s) => s.auth || {});
    const { linkCourse = {} } = useSelector((s) => s.classroom || {});
    const [search, setSearch] = useState("");

    const [limit] = useState(6);
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState({ data: [], total: 0, page: 1, totalPages: 1 });

    useEffect(() => {
        loadCourses({ page: 1, search: "" });
    }, []);

    const loadCourses = useCallback(
        async ({ page = 1, search = "" } = {}) => {
            if (!token) {
                toast.error("Missing token");
                return;
            }
            setLoading(true);
            try {
                const res = await fetchInstructorCourses({ token, page, limit, search });
                // normalize to expected shape
                // some endpoints return { data: { courses: [...] } } or { courses: [...] }
                const payload = res?.data?.courses ? res.data : res;
                setCourses(payload || { data: [], total: 0, page: 1, totalPages: 1 });
            } catch (err) {
                console.error("fetchInstructorCourses", err);
                toast.error("Failed to load courses");
            } finally {
                setLoading(false);
            }
        },
        [limit, token]
    );

    const handleSearch = () => {
        loadCourses({ page: 1, search });
    };

    const handleSelect = (c) => {
        const id = c._id || c.id || c.courseId;
        if (!id) {
            toast.error("Selected course missing id");
            return;
        }
        dispatch(setLinkCourse({ ...(linkCourse || {}), course: c, courseId: id, preview: c }));
        dispatch(setStep(3));
    };

    if (loading) return <Loading />;

    return (
        <div className="rounded-2xl border border-white/8 bg-white p-6 max-w-4xl mx-auto shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex items-center w-full sm:w-auto sm:flex-1">
                    <FiSearch className="absolute left-3 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                        placeholder="Search your courses"
                        aria-label="Search your courses"
                        className="w-full pl-10 pr-3 py-2 border border-[#efe7ff] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#996bec]/30"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button onClick={handleSearch} className="px-4 py-2">Search</Button>
                    <Button variant="light" onClick={() => { setSearch(""); loadCourses({ page: 1, search: "" }); }} className="px-4 py-2 bg-white text-black">Reset</Button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(courses.data || []).map((c) => {
                    const id = c._id || c.id || c.courseId;
                    const title = c.title || c.courseName || c.name || "Untitled course";
                    const short = (c.shortDescription || c.description || c.courseDescription || "").slice(0, 140);

                    // Use courseContent if available (sections array)
                    const sectionsCount = (Array.isArray(c.courseContent) && c.courseContent.length) || c.courseContent?.length || c.sectionCount || 0;

                    // lectures/subsections: if API provides subsectionLength, prefer it. Else compute sum.
                    let lectures = c.subsectionLength ?? c.totalLectures ?? c.totalNoOfLectures ?? c.lectureCount ?? 0;
                    if (!lectures && Array.isArray(c.courseContent)) {
                        lectures = c.courseContent.reduce((acc, s) => acc + ((Array.isArray(s.subSection) && s.subSection.length) || 0), 0);
                    }

                    const level = c.level || c.difficulty || "";
                    const category = (c.category && (typeof c.category === "string" ? c.category : c.category.name)) || c.categoryName || "";
                    const thumbnail = c.thumbnail || c.image || c.cover || c.logo || PlaceholderImage;

                    return (
                        <article key={id} className="group relative flex gap-3 p-4 bg-white rounded-2xl border border-white/8 hover:shadow-md transition">
                            <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-slate-100">
                                <img src={thumbnail} alt={title} className="w-full h-full object-cover" onError={(e) => { e.target.src = PlaceholderImage; }} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-sm md:text-base font-semibold text-[#0b1220] truncate">{title}</h3>
                                    <div className="text-xs text-slate-500">{c.price ? (typeof c.price === "number" ? `$${c.price}` : c.price) : null}</div>
                                </div>

                                <p className="text-xs text-slate-500 mt-1 line-clamp-3">{short}</p>

                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                    {category ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f3f0ff] text-[#6b4dff] border border-[#efe7ff]">
                                            {category}
                                        </span>
                                    ) : null}

                                    {level ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f7f7f9] text-[#374151] border border-[#efeff5]">
                                            {level}
                                        </span>
                                    ) : null}

                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#eefbf6] text-[#065f46] border border-[#e6fff2]">
                                        {sectionsCount} section{sectionsCount !== 1 ? "s" : ""}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#fff8ed] text-[#7a4b00] border border-[#fff2d9]">
                                        {lectures} lecture{lectures !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <div className="text-xs text-slate-400">
                                        {c.updatedAt ? `Updated ${new Date(c.updatedAt).toLocaleDateString()}` : c.createdAt ? `Created ${new Date(c.createdAt).toLocaleDateString()}` : null}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="light"
                                            onClick={() => handleSelect(c)}
                                            className="px-3 py-1 text-sm"
                                            aria-label={`Select course ${title}`}
                                        >
                                            Select
                                        </Button>

                                        <a
                                            href={`/courses/${id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs underline text-slate-500 hover:text-slate-700 hidden group-hover:inline-block"
                                            aria-label={`View course ${title}`}
                                        >
                                            View
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}

                {(!courses.data || courses.data.length === 0) && (
                    <div className="col-span-full text-sm text-slate-500 py-6">No courses found.</div>
                )}
            </div>

            {courses.total > 0 && (
                <div className="mt-5 flex items-center justify-between">
                    <div className="text-sm text-slate-500">{courses.total} course{courses.total !== 1 ? "s" : ""}</div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={courses.page <= 1}
                            onClick={() => { const p = Math.max(1, (courses.page || 1) - 1); loadCourses({ page: p, search }); }}
                            className="px-3 py-1 rounded border disabled:opacity-40"
                            aria-label="Previous page"
                        >
                            Prev
                        </button>

                        <div className="text-sm">{courses.page}/{courses.totalPages || 1}</div>

                        <button
                            disabled={courses.page >= (courses.totalPages || 1)}
                            onClick={() => { const p = Math.min((courses.totalPages || 1), (courses.page || 1) + 1); loadCourses({ page: p, search }); }}
                            className="px-3 py-1 rounded border disabled:opacity-40"
                            aria-label="Next page"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
                <Button variant="light" onClick={() => dispatch(setStep(1))} className="bg-white text-black">Back</Button>
            </div>
        </div>
    );
}
