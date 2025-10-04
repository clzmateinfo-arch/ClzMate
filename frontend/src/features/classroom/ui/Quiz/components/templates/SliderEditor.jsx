import React from "react";

export default function SliderEditor({ screen, onChange }) {
    const local = screen || {};
    const update = (patch) => onChange({ ...local, ...patch });

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium">Question</label>
                <textarea className="w-full mt-2 p-2 border rounded" value={local.body || ""} onChange={(e) => update({ body: e.target.value })} rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="text-xs">Min</label>
                    <input type="number" className="w-full p-2 border rounded" value={local.properties?.min ?? 0} onChange={(e) => update({ properties: { ...(local.properties || {}), min: Number(e.target.value) } })} />
                </div>
                <div>
                    <label className="text-xs">Max</label>
                    <input type="number" className="w-full p-2 border rounded" value={local.properties?.max ?? 100} onChange={(e) => update({ properties: { ...(local.properties || {}), max: Number(e.target.value) } })} />
                </div>
                <div>
                    <label className="text-xs">Step</label>
                    <input type="number" className="w-full p-2 border rounded" value={local.properties?.step ?? 1} onChange={(e) => update({ properties: { ...(local.properties || {}), step: Number(e.target.value) } })} />
                </div>
            </div>

            <div className="border-t pt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="text-xs">Points</label>
                    <input type="number" className="w-full p-2 border rounded" value={local.properties?.points ?? 1} onChange={(e) => update({ properties: { ...(local.properties || {}), points: Number(e.target.value) } })} />
                </div>
                <div>
                    <label className="text-xs">Time limit (s)</label>
                    <input type="number" className="w-full p-2 border rounded" value={local.properties?.timeLimit ?? 0} onChange={(e) => update({ properties: { ...(local.properties || {}), timeLimit: Number(e.target.value) } })} />
                </div>
                <div />
            </div>
        </div>
    );
}
