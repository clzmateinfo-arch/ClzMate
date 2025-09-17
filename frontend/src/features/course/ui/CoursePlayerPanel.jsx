// src/features/course/ui/CoursePlayerPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useKeyboardShortcuts from "@/features/course/hooks/useKeyboardShortcuts";
import NotesEditor from "@/features/course/ui/NotesEditor";
import { getSignedAssetUrl } from "@/entities/course/model/courseDetailsAPI";
import IconBtn from "@/shared/components/ui/IconBtn";

/**
 * CoursePlayerPanel:
 * Props:
 *  - videoData: object (supportMaterials array etc.)
 *  - courseEntireData: course meta (thumbnail, title)
 *  - onNext / onPrev handlers (optional)
 *
 * This component manages:
 *  - Signed media resolution
 *  - Rendering video or PDF
 *  - Sandbox panel toggle
 *  - Keyboard interaction via hook
 */
export default function CoursePlayerPanel({ videoData, courseEntireData, onNext, onPrev }) {
    const { courseId, sectionId, subSectionId } = useParams();
    const navigate = useNavigate();
    const playerRef = useRef(null);
    const [signedUrl, setSignedUrl] = useState(null);
    const [signedPreviewUrl, setSignedPreviewUrl] = useState(null);
    const [activeLayout, setActiveLayout] = useState("split"); // split / focus / grid
    const [sandboxOpen, setSandboxOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Resolve candidate media (like your existing logic)
    useEffect(() => {
        (async () => {
            setSignedUrl(null);
            setSignedPreviewUrl(null);
            if (!videoData) return;

            // find main video candidate
            let candidate = null;
            if (Array.isArray(videoData.supportMaterials) && videoData.supportMaterials.length) {
                candidate = videoData.supportMaterials.find((s) => s.isMainVideo)
                    || videoData.supportMaterials.find((s) => (s.resourceType || "").startsWith("video"))
                    || videoData.supportMaterials[0];
            }

            // fallback old fields
            if (!candidate && (videoData.videoUrl || videoData.videoPublicId)) {
                candidate = {
                    url: videoData.videoUrl,
                    publicId: videoData.videoPublicId,
                    resourceType: videoData.resource_type || "video",
                };
            }
            if (!candidate) return;

            try {
                if (candidate.publicId) {
                    const url = await getSignedAssetUrl({ publicId: candidate.publicId, resourceType: candidate.resourceType || "auto", type: "authenticated" }, "");
                    setSignedUrl(url || candidate.url || null);
                } else if (candidate.url) {
                    const url = await getSignedAssetUrl({ publicId: null, resourceType: candidate.resourceType || "auto", url: candidate.url, type: "authenticated" }, "");
                    setSignedUrl(url || candidate.url);
                } else setSignedUrl(null);
            } catch (e) {
                console.warn("signed media error", e);
                setSignedUrl(candidate.url || null);
            }
        })();
    }, [videoData]);

    // preview poster (course thumbnail)
    useEffect(() => {
        (async () => {
            if (!courseEntireData?.thumbnail) return;
            try {
                const url = await getSignedAssetUrl({ publicId: null, resourceType: "auto", url: courseEntireData.thumbnail, type: "authenticated" }, "");
                setSignedPreviewUrl(url || courseEntireData.thumbnail);
            } catch {
                setSignedPreviewUrl(courseEntireData.thumbnail);
            }
        })();
    }, [courseEntireData]);

    // keyboard shortcuts
    useKeyboardShortcuts({
        onPlayPause: () => {
            const el = playerRef.current;
            if (!el) return;
            if (el.paused) {
                el.play().catch(() => { });
                setIsPlaying(true);
            } else {
                el.pause();
                setIsPlaying(false);
            }
        },
        onSeek: (sec) => {
            const el = playerRef.current;
            if (!el) return;
            el.currentTime = Math.max(0, el.currentTime + sec);
        },
        onNext: onNext,
        onPrev: onPrev,
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Media area */}
            <div className={`lg:col-span-2 flex flex-col gap-4 ${activeLayout === "focus" ? "lg:col-span-3" : ""}`}>
                <div className="rounded-xl bg-black/90 overflow-hidden shadow">
                    {(!videoData || !signedUrl) ? (
                        // PDF or preview: show image/poster or pdf
                        (() => {
                            const pdf = (Array.isArray(videoData?.supportMaterials) && videoData.supportMaterials.find(s => s.isMainPdf))
                                || (Array.isArray(videoData?.supportMaterials) && videoData.supportMaterials.find(s => (s.resourceType || "").startsWith("raw") || (s.mimeType || "").includes("pdf")))
                                || null;
                            if (pdf) {
                                const pdfUrl = pdf.url || pdf.publicId;
                                return (
                                    <div className="w-full h-[56vw] md:h-[45vh] lg:h-[60vh] bg-white/5 flex items-center justify-center">
                                        <object data={pdfUrl} type="application/pdf" className="w-full h-full">
                                            <div className="p-6 text-center">
                                                <p>PDF preview not available.</p>
                                                <a href={pdfUrl} target="_blank" rel="noreferrer" className="underline text-sm">Open</a>
                                            </div>
                                        </object>
                                    </div>
                                );
                            }
                            return <img src={signedPreviewUrl || courseEntireData?.thumbnail} alt={courseEntireData?.courseName} className="w-full h-[56vw] md:h-[45vh] lg:h-[60vh] object-cover" />;
                        })()
                    ) : (
                        <div className="w-full bg-black">
                            <video
                                ref={playerRef}
                                src={signedUrl}
                                poster={signedPreviewUrl || undefined}
                                controls
                                playsInline
                                autoPlay
                                className="w-full h-[56vw] md:h-[45vh] lg:h-[60vh] object-cover"
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveLayout("split")} className={`px-3 py-1 rounded ${activeLayout === "split" ? "bg-violet-600 text-white" : "bg-white/6"}`}>Split</button>
                        <button onClick={() => setActiveLayout("focus")} className={`px-3 py-1 rounded ${activeLayout === "focus" ? "bg-violet-600 text-white" : "bg-white/6"}`}>Focus</button>
                        <button onClick={() => setActiveLayout("grid")} className={`px-3 py-1 rounded ${activeLayout === "grid" ? "bg-violet-600 text-white" : "bg-white/6"}`}>Grid</button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => onPrev && onPrev()} className="px-3 py-1 bg-white/6 rounded">Prev</button>
                        <button onClick={() => onNext && onNext()} className="px-3 py-1 bg-white/6 rounded">Next</button>
                        <button onClick={() => setSandboxOpen(s => !s)} className="px-3 py-1 bg-amber-400/90 rounded">Sandbox</button>
                        <IconBtn text={isPlaying ? "Pause" : "Play"} onclick={() => {
                            const el = playerRef.current; if (!el) return;
                            if (el.paused) el.play().catch(() => { }); else el.pause();
                        }} />
                    </div>
                </div>
            </div>

            {/* Right column: Notes + Details + Sandbox */}
            <aside className="lg:col-span-1 flex flex-col gap-4">
                <div className="rounded-xl p-3 bg-white/6">
                    <h3 className="font-semibold">Lecture</h3>
                    <p className="text-sm text-muted">{videoData?.title || "Untitled"}</p>
                    <p className="text-xs mt-2">{videoData?.description}</p>
                </div>

                <div className="rounded-xl p-3 bg-white/6 flex-1 overflow-auto">
                    <NotesEditor lectureId={videoData?._id} />
                </div>

                {sandboxOpen && (
                    <div className="rounded-xl p-3 bg-white/6 h-48 overflow-auto">
                        <h4 className="font-semibold">Sandbox</h4>
                        <p className="text-xs mb-2">Language: {videoData?.sandboxLanguage || "javascript"}</p>
                        <iframe
                            title="sandbox"
                            src={`/sandbox?lang=${encodeURIComponent(videoData?.sandboxLanguage || "javascript")}`}
                            className="w-full h-full border rounded"
                        />
                    </div>
                )}
            </aside>
        </div>
    );
}
