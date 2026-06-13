import { useMemo, useState } from "react";
import { FiExternalLink, FiPlay, FiChevronDown } from "react-icons/fi";

export default function SandboxPanel({
    embedUrl: _embedUrl = "",
    allowNew: _allowNew = true,
    className = "",
}) {
    const [open, setOpen] = useState(true);
    const [showControls, setShowControls] = useState(true);

    const iframeSrc = useMemo(() => {
        return "https://jupyterlite.github.io/demo/lab/index.html";
    }, []);

    const openInNewTab = () => {
        if (!iframeSrc) return;
        window.open(iframeSrc, "_blank", "noopener,noreferrer");
    };

    return (
        <div className={`bg-slate-800/40 rounded-xl p-2 flex flex-col ${className}`} style={{ height: "100%" }}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-indigo-600 w-9 h-9 grid place-items-center text-white font-semibold">
                        <FiPlay />
                    </div>
                    <div>
                        <div className="text-sm font-medium">Sandbox</div>
                        <div className="text-xs text-slate-300">Interactive Python playground</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowControls((s) => !s)}
                        className="px-2 py-1 rounded bg-slate-700 text-xs text-white hover:bg-slate-600"
                        title="Toggle controls"
                    >
                        {showControls ? "Hide controls" : "Show controls"}
                    </button>
                    <button
                        onClick={openInNewTab}
                        className="px-2 py-1 rounded bg-white/6 text-xs text-white hover:bg-white/10 flex items-center gap-2"
                        title="Open in new tab"
                    >
                        <FiExternalLink /> Open
                    </button>
                    <button
                        onClick={() => setOpen((o) => !o)}
                        className="px-2 py-1 rounded bg-slate-700 text-xs text-white hover:bg-slate-600 flex items-center gap-1"
                        title={open ? "Collapse" : "Expand"}
                    >
                        <FiChevronDown className={`${open ? "rotate-0" : "-rotate-90"} transition-transform`} />
                        {open ? "Collapse" : "Expand"}
                    </button>
                </div>
            </div>

            {showControls && (
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                        <label className="text-slate-300">Starter:</label>
                        <span className="px-2 py-0.5 rounded bg-slate-700 text-white">Python 3</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-slate-300">Embed:</label>
                        <span className="px-2 py-0.5 rounded bg-slate-700 text-white truncate max-w-[260px]">
                            {iframeSrc || "none"}
                        </span>
                    </div>
                </div>
            )}

            <div className="mt-3 flex-grow overflow-hidden border border-slate-700 rounded-md transition-all duration-300">
                {open ? (
                    <iframe
                        title="codesandbox"
                        src={iframeSrc}
                        sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin"
                        className="w-full h-full border-0"
                    />
                ) : (
                    <div className="p-6 text-center text-slate-400">No sandbox available.</div>
                )}
            </div>
        </div>
    );
}
