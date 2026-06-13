
export default function PuzzleEditor({ screen, onChange }) {
    const local = screen || {};
    const update = (patch) => onChange({ ...local, ...patch });

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium">Puzzle description</label>
                <textarea className="w-full mt-2 p-2 border rounded" value={local.body || ""} onChange={(e) => update({ body: e.target.value })} rows={4} />
            </div>

            <div className="text-sm text-slate-500">Puzzle editor is flexible   store puzzle payload in <code>screen.options</code> or <code>screen.resources</code>.</div>

            <div className="border-t pt-3">
                <label className="text-xs">Points</label>
                <input type="number" className="w-full p-2 border rounded" value={local.properties?.points ?? 1} onChange={(e) => update({ properties: { ...(local.properties || {}), points: Number(e.target.value) } })} />
            </div>
        </div>
    );
}
