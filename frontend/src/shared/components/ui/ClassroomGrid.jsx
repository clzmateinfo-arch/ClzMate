// frontend/src/shared/components/ui/ClassroomGrid.jsx
import React from "react";
import ClassroomCard from "@/shared/components/ui/ClassroomCard";

export default function ClassroomGrid({ classrooms = [], onOpen = () => { }, onMembers = () => { }, onCopyInvite = () => { } }) {
    let arr = classrooms;
    if (!Array.isArray(arr)) {
        if (arr && Array.isArray(arr.data)) arr = arr.data;
        else if (arr && Array.isArray(arr.list)) arr = arr.list;
        else arr = [];
    }

    if (!arr || arr.length === 0) {
        return <div className="py-12 text-center text-sm text-slate-400">No classrooms found</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {arr.map((c) => (
                <ClassroomCard
                    key={c._id || c.id}
                    classroom={c}
                    onOpen={onOpen}
                    onMembers={onMembers}
                    onCopyInvite={onCopyInvite}
                />
            ))}
        </div>
    );
}
