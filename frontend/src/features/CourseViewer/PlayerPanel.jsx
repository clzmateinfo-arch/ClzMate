// src/features/courseViewer/PlayerPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import { getSignedAssetUrl } from "@/entities/course/model/courseDetailsAPI";
import useKeyboardShortcuts from "@/shared/hooks/useKeyboardShortcuts";

export default function PlayerPanel({ sub, course, token, onNext = () => { }, onPrev = () => { } }) {
    const playerRef = useRef(null);
    const [signedUrl, setSignedUrl] = useState(null);
    const [signedPreview, setSignedPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    // choose best candidate: isMainVideo or resourceType startsWith('video') else first pdf/raw
    useEffect(() => {
        (async () => {
            setSignedUrl(null);
            if (!sub) return;
            setLoading(true);

            let candidate = null;
            if (Array.isArray(sub.supportMaterials) && sub.supportMaterials.length) {
                candidate = sub.supportMaterials.find(s => s.isMainVideo) ||
                    sub.supportMaterials.find(s => (s.resourceType || "").startsWith("video")) ||
                    sub.supportMaterials.find(s => s.isMainPdf) ||
                    sub.supportMaterials[0];
            }

            // fallback properties - older data
            if (!candidate && (sub.videoUrl || sub.videoPublicId)) {
                candidate = { url: sub.videoUrl, publicId: sub.videoPublicId, resourceType: sub.resource_type || "video" };
            }

            if (!candidate) { setLoading(false); return; }

            try {
                let resolved;
                if (candidate.publicId) {
                    resolved = await getSignedAssetUrl({ publicId: candidate.publicId, resourceType: candidate.resourceType || "auto", type: "authenticated" }, token);
                } else if (candidate.url) {
                    resolved = await getSignedAssetUrl({ url: candidate.url, resourceType: candidate.resourceType || "auto", type: "authenticated" }, token);
                }
                // API returns {success:true, url: signedUrl} in your implementation — but in your frontend helper you returned url string
                const finalUrl = (typeof resolved === "string" && resolved) || resolved?.url || candidate.url;
                setSignedUrl(finalUrl);
            } catch (e) {
                console.warn("Signing failed", e);
                setSignedUrl(candidate.url);
            } finally { setLoading(false); }
        })();
    }, [sub, token]);

    // keyboard mappings via hook
    useKeyboardShortcuts({
        onTogglePlay: () => {
            const el = playerRef.current;
            if (!el) return;
            if (el.paused) el.play().catch(() => { });
            else el.pause();
        },
        onSeek: (delta) => {
            try { playerRef.current.currentTime = Math.max(0, playerRef.current.currentTime + delta); } catch (e) { }
        },
        onNext,
        onPrev,
    });

    if (!sub) {
        return <div className="rounded-xl bg-slate-800/40 p-8 text-center">Select a lecture to start</div>;
    }

    // if it's pdf: resourceType includes 'pdf' or mime type application/pdf OR originalName endswith .pdf
    const isPdf = (s) => {
        const mt = (s.mimeType || "").toLowerCase();
        const name = (s.originalName || "").toLowerCase();
        return mt === "application/pdf" || name.endsWith(".pdf") || (s.resourceType || "").startsWith("raw") && name.endsWith(".pdf");
    };

    const primary = (() => {
        if (!sub.supportMaterials || !sub.supportMaterials.length) return null;
        const m = sub.supportMaterials.find(s => s.isMainVideo || s.isMainPdf) || sub.supportMaterials[0];
        return m;
    })();

    return (
        <div className="w-full rounded-xl overflow-hidden bg-black">
            {primary && isPdf(primary) ? (
                // PDF view (object fallback)
                <div className="w-full h-[64vh] md:h-[72vh]">
                    <object data={signedUrl || primary.url} type="application/pdf" className="w-full h-full">
                        <div className="p-6 text-center text-slate-400">
                            Preview unavailable — <a className="text-indigo-400 underline" href={signedUrl || primary.url} target="_blank" rel="noreferrer">Open file</a>
                        </div>
                    </object>
                </div>
            ) : (
                // video
                <div className="w-full bg-black">
                    <video
                        ref={playerRef}
                        src={signedUrl || primary?.url}
                        poster={course?.thumbnail || undefined}
                        controls
                        className="w-full h-[64vh] md:h-[72vh] object-contain bg-black"
                        playsInline
                    />
                </div>
            )}
            <div className="p-4 bg-slate-900/60 flex items-center justify-between">
                <div>
                    <div className="font-medium">{sub.title}</div>
                    <div className="text-xs text-slate-400">{sub.timeDuration ? `${Math.round(sub.timeDuration / 60)} min` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onPrev} className="px-3 py-1 rounded bg-slate-700">Prev</button>
                    <button onClick={onNext} className="px-3 py-1 rounded bg-indigo-600">Next</button>
                </div>
            </div>
        </div>
    );
}
