 

export default function Pagination({
    page,
    totalPages,
    onPageChange,
    onPrev,
    onNext,
}) {
    if (!totalPages || totalPages <= 1) return null;

    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    for (let p = start; p <= end; p += 1) pages.push(p);

    return (
        <nav className="flex items-center gap-2 justify-center py-4" role="navigation" aria-label="Pagination">
            <button
                onClick={() => onPrev && onPrev()}
                disabled={page <= 1}
                className="px-3 py-1 rounded-md border bg-white/6 hover:bg-white/10 disabled:opacity-50"
            >
                Prev
            </button>

            {start > 1 && (
                <>
                    <button onClick={() => onPageChange(1)} className="px-3 py-1 rounded-md border bg-white/6 hover:bg-white/10">1</button>
                    {start > 2 && <span className="px-2">…</span>}
                </>
            )}

            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`px-3 py-1 rounded-md border ${p === page ? "bg-violet-600 text-white" : "bg-white/6 hover:bg-white/10"}`}
                >
                    {p}
                </button>
            ))}

            {end < totalPages && (
                <>
                    {end < totalPages - 1 && <span className="px-2">…</span>}
                    <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded-md border bg-white/6 hover:bg-white/10">{totalPages}</button>
                </>
            )}

            <button
                onClick={() => onNext && onNext()}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-md border bg-white/6 hover:bg-white/10 disabled:opacity-50"
            >
                Next
            </button>
        </nav>
    );
}
