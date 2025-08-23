/* eslint-disable react/prop-types */
import React from "react";
import CourseCard from "@/features/courseCatalog/ui/CourseCard";

export default function CourseGrid({ cards = [], onAddToCart = () => { } }) {
    if (!cards || cards.length === 0) {
        return <div className="py-12 text-center text-sm text-gray-500">No courses found</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mr-5 ml-5">
            {cards.map((c, i) => (
                <CourseCard key={c.id ?? i} course={c} onAddToCart={onAddToCart} />
            ))}
        </div>
    );
}
