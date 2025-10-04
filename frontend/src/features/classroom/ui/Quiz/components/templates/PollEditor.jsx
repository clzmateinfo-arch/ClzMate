import React from "react";
import { FiTrash2 } from "react-icons/fi";

export default function PollEditor({ screen, onChange }) {
    const local = screen || {};
    const opts = local.options || [];

    const update = (patch) => onChange({ ...local, ...patch });

    const addOption = () => update({ options: [...opts, { text: "New", votes: 0 }] });
    const updateOption = (i, v) => {
        const copy = [...opts];
        copy[i] = { ...copy[i], text: v };
        update({ options: copy });
    };
    const removeOption = (i) => {
        const copy = [...opts];
        copy.splice(i, 1);
        update({ options: copy });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium">Poll question</label>
                <textarea className="w-full mt-2 p-2 border rounded" value={local.body || ""} onChange={(e) => update({ body: e.target.value })} rows={3} />
            </div>

            <div>
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Options</label>
                    <button type="button" onClick={addOption} className="px-2 py-1 border rounded text-sm">Add</button>
                </div>
                <div className="mt-2 space-y-2">
                    {opts.map((o, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input className="flex-1 p-2 border rounded" value={o.text} onChange={(e) => updateOption(i, e.target.value)} />
                            <button type="button" onClick={() => removeOption(i)} className="p-2 text-red-500"><FiTrash2 /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
