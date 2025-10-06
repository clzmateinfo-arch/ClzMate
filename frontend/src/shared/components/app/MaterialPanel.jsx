import React from "react";
import MaterialCard from "./MaterialCard";

export default function MaterialPanel({ topic = null, token }) {
    const materials = (topic?.items || []).filter((i) => i.type === "material");
    return (
        <div className="p-3 h-full overflow-auto">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Materials</h3>
                <div className="text-xs text-slate-400">{materials.length}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                {materials.length === 0 && <div className="text-sm text-slate-500">No materials</div>}
                {materials.map((m) => (
                    <MaterialCard key={m._id} item={m} topicId={topic?._id} token={token} />
                ))}
            </div>
        </div>
    );
}
