import React, { useEffect, useState } from "react";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import CourseGrid from "@/shared/components/ui/CourseGrid";
import Loading from "@/shared/components/navigation/Loading";
import { getAllCourses } from "@/entities/course/model/courseDetailsAPI";
import { useLocation } from "react-router-dom";

export function NewCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);

    async function loadPopular() {
        setLoading(true);
        try {
            const res = await getAllCourses({ page: 1, limit: 3, sort: "" });

            const received =
                res?.data?.data?.courses ??
                res?.data?.data ??
                res?.data?.courses ??
                res?.data ??
                res?.courses ??
                res?.items ??
                [];

            if (!received || received.length === 0) {
                const fallback = await getAllCourses({ page: 1, limit: 200 });
                const all =
                    fallback?.data?.data?.courses ??
                    fallback?.data?.data ??
                    fallback?.data?.courses ??
                    fallback?.data ??
                    fallback?.courses ??
                    fallback?.items ??
                    [];

                const sorted = Array.isArray(all)
                    ? all
                        .slice()
                        .sort(
                            (a, b) =>
                                (b?.studentsEnrolled?.length ?? b?.studentsEnrolled ?? 0) -
                                (a?.studentsEnrolled?.length ?? a?.studentsEnrolled ?? 0)
                        )
                        .slice(0, 3)
                    : [];

                setCourses(sorted);
            } else {
                setCourses(received.slice(0, 3));
            }
        } catch (err) {
            console.error("Failed to load popular courses", err);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPopular();
    }, [useLocation().pathname]);

    function onAddToCart(course) {
        console.log("add", course);
    }

    console.log("courses", courses);

    return (
        <section className="relative bg-white py-10 xl:py-10 overflow-visible">
            <div className="mt-20 relative container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="gap-x-8 xl:gap-x-16 items-center">
                    <div className="space-y-4">
                        <span className="inline-flex mb-1 rounded-full px-2.5 py-0.5 text-xs tracking-wide font-extrabold text-black bg-gradient-to-br from-green-300/50 to-green-300/50 ring-1 ring-green-500/35">
                            NEW!
                        </span>

                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#0b1220]">
                            New Courses
                        </h2>

                        <p className="text-lg text-[#374151] max-w-2xl mb-10">
                            Discover top curated courses loved by our students practical, hands-on, and instructor led
                        </p>

                        {loading ? (
                            <div className="py-8">
                                <div className="flex justify-center">
                                    <Loading />
                                </div>
                            </div>
                        ) : (
                            <CourseGrid cards={courses} onAddToCart={onAddToCart} />
                        )}

                        <div className="mt-6 mr-5 flex justify-end">
                            <LinkButton
                                to="/catalog/all"
                                className="btn-xl group/btn btn-border-dark rounded-full"
                                variant="light"
                            >
                                Explore More
                            </LinkButton>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default NewCourses;
