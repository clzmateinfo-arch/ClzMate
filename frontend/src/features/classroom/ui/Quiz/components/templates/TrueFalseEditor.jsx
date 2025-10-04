import React from "react";

export default function TrueFalseEditor({ screen, onChange }) {
    const local = screen || {};

    const setCorrect = (isTrue) => {
        onChange({
            ...local,
            options: [{ text: "True", correct: isTrue }, { text: "False", correct: !isTrue }],
        });
    };

    const update = (patch) => onChange({ ...local, ...patch });

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium">Question</label>
                <textarea className="w-full mt-2 p-2 border rounded" value={local.body || ""} onChange={(e) => update({ body: e.target.value })} rows={3} />
            </div>

            <div className="flex gap-3">
                <button type="button" onClick={() => setCorrect(true)} className="px-3 py-1 border rounded">Mark True</button>
                <button type="button" onClick={() => setCorrect(false)} className="px-3 py-1 border rounded">Mark False</button>
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
