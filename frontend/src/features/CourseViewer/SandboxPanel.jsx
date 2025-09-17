// src/features/courseViewer/SandboxPanel.jsx
import React, { useState } from "react";

export default function SandboxPanel({ language = "javascript" }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="bg-slate-800/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Sandbox ({language})</h4>
                <button onClick={() => setOpen(!open)} className="text-sm px-2 py-1 rounded bg-slate-700">{open ? "Hide" : "Show"}</button>
            </div>

            {open && (
                <div className="w-full h-[300px] border border-slate-700 rounded overflow-hidden">
                    {/* Replace src with your internal sandboxes or embed a 3rd-party */}
                    <iframe title="sandbox" src={`https://your-sandbox-host.example/?lang=${language}`} className="w-full h-full" />
                </div>
            )}
        </div>
    );
}
