import { useState } from "react";
import { FiTrash2, FiEdit, FiMove, FiChevronDown, FiChevronRight } from "react-icons/fi";

export default function ScreenSection({
    screen,
    index,
    active,
    onSelect,
    onDelete,
    onDragStart,
    onDrop,
    onDragOver,
    onEdit,
}) {
    const [open, setOpen] = useState(false);
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDrop={onDrop}
            onDragOver={onDragOver}
            className={`rounded-lg p-2 border-neutral-300 ${active ? "bg-violet-50 border-violet-200" : "bg-white"} flex flex-col`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => { onSelect(); setOpen((v) => !v); }}>
                    <div className="p-1 rounded-md text-slate-600">
                        {open ? <FiChevronDown /> : <FiChevronRight />}
                    </div>
                    <div>
                        <div className="text-sm font-medium truncate">{screen.body ? screen.body.slice(0, 60) : `Screen ${index + 1}`}</div>
                        <div className="text-xs text-slate-400">{screen.type || "multiple"}</div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button type="button" title="Edit" onClick={onEdit} className="p-1"><FiEdit /></button>
                    <button type="button" title="Delete" onClick={onDelete} className="p-1 text-red-500"><FiTrash2 /></button>
                    <div className="p-1 text-slate-400"><FiMove /></div>
                </div>
            </div>

            {open && (
                <div className="mt-2 text-sm text-slate-600">
                    <div className="mb-1">Points: <strong>{screen.properties?.points ?? 1}</strong></div>
                    <div className="mb-1">Time: <strong>{screen.properties?.timeLimit ?? 0}s</strong></div>
                    <div className="text-xs text-slate-400">Click title to open editor</div>
                </div>
            )}
        </div>
    );
}
