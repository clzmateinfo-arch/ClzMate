// frontend/src/features/classroom/ui/LinkBox.jsx
import { useState } from "react";

/**
 * Shows a preview of the selectedItem.link via an iframe and provides Open in new tab.
 * Props:
 * - selectedItem
 */
export default function LinkBox({ selectedItem }) {
    const [showIframe, setShowIframe] = useState(false);
    if (!selectedItem || !(selectedItem.link || selectedItem.refId)) {
        return (
            <div className="h-full p-4 bg-white text-slate-900 flex items-center justify-center">
                <div className="text-slate-500">Select a linked subsection to preview</div>
            </div>
        );
    }

    // Prefer absolute link if provided; if link is relative, assume app route
    const linkUrl = selectedItem.link || selectedItem.url || `/view-course/${selectedItem.refId || ""}`;

    return (
        <div className="h-full p-4 bg-white text-slate-900 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Linked Section</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowIframe(s => !s)} className="px-2 py-1 rounded bg-indigo-600 text-white text-sm">
                        {showIframe ? "Hide" : "Preview"}
                    </button>
                    <a href={linkUrl} rel="noreferrer" target="_blank" className="px-2 py-1 rounded bg-slate-100 text-slate-900 text-sm">Open</a>
                </div>
            </div>

            {showIframe ? (
                <div className="flex-1 border rounded overflow-hidden">
                    <iframe
                        title="linked-subsection"
                        src={linkUrl}
                        className="w-full h-full"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
                    />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                    Preview not enabled
                </div>
            )}
        </div>
    );
}
