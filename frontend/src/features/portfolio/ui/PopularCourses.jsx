import React from "react";
import { LinkedButton } from "@/shared/components/ui/LinkButton";
import adImg from "@/shared/assets/images/porfolio/advertisment.png";
import CourseGrid from "../../courseCatalog/ui/CourseGrid";


const cards = [
    {
        id: "c1",
        title: "Modern React with Hooks",
        instructor: "Jane Doe",
        img: "/src/shared/assets/images/porfolio/fly-globe.png",
        price: "$39",
        duration: "6h",
        level: "Intermediate",
        rating: 4.6,
        href: "/courses/react-hooks",
        publishedAt: "2025-08-20T12:00:00Z"
    },
    {
        id: "c3",
        title: "Modern React with Hooks",
        instructor: "Jane Doe",
        img: "/src/shared/assets/images/porfolio/fly-globe.png",
        price: "$39",
        duration: "6h",
        level: "Intermediate",
        rating: 4.6,
        href: "/courses/react-hooks",
        publishedAt: "2025-08-20T12:00:00Z"
    },
    {
        id: "c4",
        title: "Modern React with Hooks",
        instructor: "Jane Doe",
        img: "/src/shared/assets/images/porfolio/fly-globe.png",
        price: "$39",
        duration: "6h",
        level: "Intermediate",
        rating: 4.6,
        href: "/courses/react-hooks",
        publishedAt: "2025-08-20T12:00:00Z"
    },
];

export function PopularCourses() {

    function onAddToCart(course) {
        console.log("add", course);
    }

    return (
        <section className="relative bg-white py-10 xl:py-10 overflow-visible">
            <div
                className="rotate-3 absolute -inset-x-12 -top-6 h-12 bg-gradient-to-r from-sky-300 via-indigo-300 to-pink-300 blur-3xl opacity-60 pointer-events-none"
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 bg-gradient-to-tr from-sky-300/10 via-indigo-300/10 to-pink-300/10 pointer-events-none"
                aria-hidden="true"
                style={{
                    WebkitMaskImage:
                        "linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0))",
                    maskImage:
                        "linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0))",
                }}
            />

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="gap-x-8 xl:gap-x-16 items-center">
                    <div className="space-y-4">
                        <span className="inline-flex mb-1 rounded-full px-2.5 py-0.5 text-xs tracking-wide font-extrabold text-emerald-600 bg-gradient-to-br from-green-300/50 to-emerald-300/50 ring-1 ring-emerald-500/35">
                            NEW!
                        </span>

                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#0b1220]">
                            Popular Courses
                        </h2>

                        <p className="text-lg text-[#374151] max-w-2xl mb-10">
                            Discover top curated courses loved by our students—practical, hands-on, and instructor led
                        </p>

                        <CourseGrid cards={cards} onAddToCart={onAddToCart} />

                        <div className="mt-6 mr-5 flex justify-end">
                            <LinkedButton
                                to="/catalog/all"
                                className="btn-xl group/btn btn-border-dark rounded-full"
                                variant="light"
                            >
                                Explore More
                            </LinkedButton>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default PopularCourses;
