// src/features/courseViewer/PlayerPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import { getSignedAssetUrl } from "@/entities/course/model/courseDetailsAPI";
import useKeyboardShortcuts from "@/shared/hooks/useKeyboardShortcuts";

export default function PlayerPanel({
    sub,
    course,
    token,
    onNext = () => { },
    onPrev = () => { },
    preferredType,
    overrideResource,
    presentMode = false,
    onExitPresent = () => { },
}) {
    const playerRef = useRef(null);
    const [signedUrl, setSignedUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setSignedUrl(null);
            if (!sub) return;
            setLoading(true);

            const isPdf = (s) => {
                const mt = (s.mimeType || "").toLowerCase();
                const name = (s.originalName || "").toLowerCase();
                return (
                    mt === "application/pdf" ||
                    name.endsWith(".pdf") ||
                    ((s.resourceType || "").startsWith("raw") && name.endsWith(".pdf"))
                );
            };

            try {
                let candidate = null;
                if (overrideResource) {
                    candidate = overrideResource;
                } else {
                    const materials = Array.isArray(sub.supportMaterials) ? sub.supportMaterials : [];

                    if (preferredType === "video") {
                        candidate = materials.find((s) => !!s.isMainVideo) ||
                            materials.find((s) => (s.resourceType || "").startsWith("video")) || null;
                    } else if (preferredType === "pdf") {
                        candidate = materials.find((s) => !!s.isMainPdf) ||
                            materials.find((s) => isPdf(s)) || null;
                    }

                    if (!candidate) {
                        candidate = materials.find((s) => s.isMainVideo) ||
                            materials.find((s) => (s.resourceType || "").startsWith("video")) ||
                            materials.find((s) => s.isMainPdf) ||
                            materials[0] ||
                            null;
                    }
                }

                if (!candidate) {
                    setLoading(false);
                    return;
                }

                let resolved;
                if (candidate.publicId) {
                    resolved = await getSignedAssetUrl(
                        { publicId: candidate.publicId, resourceType: candidate.resourceType || "auto", type: "authenticated" },
                        token
                    );
                } else if (candidate.url) {
                    resolved = await getSignedAssetUrl({ url: candidate.url, resourceType: candidate.resourceType || "auto", type: "authenticated" }, token);
                }

                const finalUrl = (typeof resolved === "string" && resolved) || resolved?.url || candidate.url;
                if (mounted) setSignedUrl(finalUrl);
            } catch (e) {
                console.warn("Signing failed", e);
                const fallback = (sub.supportMaterials && sub.supportMaterials[0] && sub.supportMaterials[0].url) || null;
                if (mounted) setSignedUrl(fallback);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [sub, token, preferredType, overrideResource]);

    // keyboard mappings via hook
    useKeyboardShortcuts({
        onTogglePlay: () => {
            const el = playerRef.current;
            if (!el) return;
            if (el.paused) el.play().catch(() => { });
            else el.pause();
        },
        onSeek: (delta) => {
            try {
                playerRef.current.currentTime = Math.max(0, playerRef.current.currentTime + delta);
            } catch (e) { }
        },
        onNext,
        onPrev,
    });

    if (!sub) {
        return <div className="rounded-xl bg-slate-800/40 p-8 text-center">Select a lecture to start</div>;
    }

    const materials = Array.isArray(sub.supportMaterials) ? sub.supportMaterials : [];
    const primary = (() => {
        if (overrideResource) return overrideResource;
        if (preferredType === "video") {
            return materials.find((s) => s.isMainVideo) || materials.find((s) => (s.resourceType || "").startsWith("video")) || null;
        }
        if (preferredType === "pdf") {
            return materials.find((s) => s.isMainPdf) || materials.find((s) => (s.mimeType || "").toLowerCase() === "application/pdf") || null;
        }
        return materials.find((s) => s.isMainVideo) || materials.find((s) => (s.resourceType || "").startsWith("video")) || materials.find((s) => s.isMainPdf) || materials[0] || null;
    })();

    const isPdfPrimary = primary && ((primary.mimeType || "").toLowerCase() === "application/pdf" || (primary.originalName || "").toLowerCase().endsWith(".pdf") || primary.isMainPdf);

    // when in present mode, auto-play video when possible
    useEffect(() => {
        if (presentMode && playerRef.current && playerRef.current.tagName === "VIDEO") {
            playerRef.current.play().catch(() => { });
            // Note: Fullscreen is requested by the Box overlay (document.requestFullscreen) so no need to request here.
        }
    }, [presentMode]);

    const renderPdf = () => {
        const url = signedUrl || primary?.url;
        if (!url) {
            return <div className="w-full h-full flex items-center justify-center text-slate-400">No preview</div>;
        }

        // Some viewers respect #toolbar=0 etc — append when not present already
        const hash = "#toolbar=0&navpanes=0&scrollbar=0";
        const urlWithHash = url.includes("#") ? url : `${url}${hash}`;

        // If present mode: iframe with allowFullScreen so it can be shown fullscreen, and we overlay the top to prevent clicks on toolbars.
        if (presentMode) {
            return (
                <div className="w-full h-full relative bg-black">
                    <iframe
                        title={primary?.originalName || "pdf"}
                        src={urlWithHash}
                        className="w-full h-full"
                        // allow fullscreen so in-frame viewers can enter presentation if they want
                        allowFullScreen
                        allow="fullscreen"
                        // include allow-same-origin and allow-scripts so PDF.js (if used) can run — adjust as per security needs
                        sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
                    />
                    {/* overlay top area to block built-in toolbar clicks */}
                    <div
                        aria-hidden
                        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, zIndex: 40 }}
                        onContextMenu={(e) => e.preventDefault()}
                    />
                </div>
            );
        }

        // non-present mode fallback
        return (
            <object data={url} type="application/pdf" className="w-full h-full">
                <div className="p-6 text-center text-slate-400">
                    Preview unavailable —{" "}
                    <a className="text-indigo-400 underline" href={url} target="_blank" rel="noreferrer">
                        Open file
                    </a>
                </div>
            </object>
        );
    };

    return (
        <div className="w-full rounded-xl overflow-hidden bg-black h-full flex flex-col">
            <div className="flex-1">
                {isPdfPrimary ? (
                    <div className={`w-full ${presentMode ? "h-full" : "h-[64vh] md:h-[72vh]"}`} aria-live="polite">
                        {renderPdf()}
                    </div>
                ) : (
                    <div className="w-full bg-black">
                        <video
                            ref={playerRef}
                            src={signedUrl || primary?.url}
                            poster={course?.thumbnail || undefined}
                            controls
                            className={`w-full ${presentMode ? "h-full" : "h-[64vh] md:h-[72vh]"} object-contain bg-black`}
                            playsInline
                            // when in present mode we want larger controls; autoplay handled by effect
                            autoPlay={presentMode}
                        />
                    </div>
                )}
            </div>

            {!presentMode && (
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
            )}

            {presentMode && (
                <div className="absolute top-3 right-3 z-50">
                    <button onClick={onExitPresent} className="px-3 py-1 rounded bg-white/10 text-white backdrop-blur-sm">Exit</button>
                </div>
            )}
        </div>
    );
}
