import React from "react";
import CourseCard from "@/shared/components/ui/CourseCard";

export default function CourseGrid({ cards = [], onAddToCart = () => { } }) {
    if (!cards || cards.length === 0) {
        return <div className="py-12 text-center text-sm text-gray-500">No courses found</div>;
    }

    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cards.map((c, i) => (
                <CourseCard key={c._id ?? i} course={c} onAddToCart={onAddToCart} />
            ))}
        </div>
    );
}
