import React from "react";
import MaterialCard from "./MaterialCard";

export default function MaterialPanel({ topic = null, token, onDownload = () => { }, onTogglePublish = () => { } }) {
    const materials = (topic?.items || []).filter(i => i?.type === "material" && i?.status === "published");
    const count = materials.length;

    return (
        <div className="p-3 h-full overflow-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Materials</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{count} item{count !== 1 ? "s" : ""}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                {materials.length === 0 && <div className="col-span-full text-sm text-slate-500 dark:text-slate-400">No materials</div>}
                {materials.map(m => (
                    <MaterialCard
                        key={m._id || m.id}
                        item={m}
                        topicId={topic?._id}
                        token={token}
                        onDownload={(file) => onDownload(m, file)}
                        onTogglePublish={() => onTogglePublish(m)}
                    />
                ))}
            </div>
        </div>
    );
}
