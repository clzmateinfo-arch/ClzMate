// simple fallback modal:
function SimpleModal({ open, onClose, children, title }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full z-10 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">{title}</div>
                    <button onClick={onClose} className="text-slate-600">Close</button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}

function StudentSimulation({ screen }) {
    if (!screen) return <div className="p-4 text-sm text-slate-500">Nothing to preview</div>;
    const { type, body = "", options = [] } = screen;
    return (
        <div className="p-4">
            <div className="text-lg font-semibold mb-3">{body || "Question"}</div>
            <div className="space-y-3">
                {type === "multiple" && (options || []).map((o, i) => (
                    <div key={i} className="p-3 border rounded flex items-center gap-3">
                        <input type="radio" name="preview_choice" />
                        <div>{o.text}</div>
                    </div>
                ))}

                {type === "truefalse" && (
                    <div className="flex gap-3">
                        <button className="px-4 py-2 border rounded">True</button>
                        <button className="px-4 py-2 border rounded">False</button>
                    </div>
                )}

                {type === "short" && <input className="w-full p-2 border rounded" placeholder="Type your answer..." />}

                {type === "slider" && <input type="range" min={0} max={100} className="w-full" />}

                {type === "poll" && (options || []).map((o, i) => <div key={i} className="p-2 border rounded">{o.text}</div>)}

                {type === "puzzle" && <div className="p-4 border rounded">Puzzle preview (interactive)</div>}
            </div>
        </div>
    );
}

export default function ScreenPreviewModal({ open, onClose, screen }) {
    return (
        <SimpleModal open={open} onClose={onClose} title="Screen preview">
            <StudentSimulation screen={screen} />
        </SimpleModal>
    );
}
