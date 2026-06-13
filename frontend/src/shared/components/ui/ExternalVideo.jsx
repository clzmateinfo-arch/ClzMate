import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaCog, FaExpand, FaCompress } from "react-icons/fa";

function parseYouTubeId(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        if (host.includes("youtube.com")) return u.searchParams.get("v");
        if (host === "youtu.be") return u.pathname.replace("/", "");
    } catch {
        return null;
    }
    return null;
}

function formatTime(sec = 0) {
    const s = Math.floor(sec || 0);
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
}

const FALLBACK_QUALITIES = ["auto", "small", "medium", "large", "hd720", "hd1080", "highres"];

export default function ExternalVideo({ url }) {
    const ytId = parseYouTubeId(url);
    const playerContainerRef = useRef(null);
    const rootRef = useRef(null);
    const playerRef = useRef(null);
    const rafRef = useRef(null);

    const [, setReady] = useState(false);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [showPoster, setShowPoster] = useState(false);
    const [qualityLevels, setQualityLevels] = useState([]);
    const [qualitySelected, setQualitySelected] = useState("auto");
    const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const posterUrls = [
        ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null,
        ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null,
    ].filter(Boolean);

    useEffect(() => {
        if (!ytId) return;
        let mounted = true;

        const ensureApi = () =>
            new Promise((resolve) => {
                if (window.YT && window.YT.Player) return resolve(window.YT);
                if (document.getElementById("youtube-iframe-api")) {
                    const wait = () => {
                        if (window.YT && window.YT.Player) resolve(window.YT);
                        else setTimeout(wait, 50);
                    };
                    wait();
                    return;
                }
                const s = document.createElement("script");
                s.id = "youtube-iframe-api";
                s.src = "https://www.youtube.com/iframe_api";
                document.body.appendChild(s);
                window.onYouTubeIframeAPIReady = () => resolve(window.YT);
            });

        (async () => {
            try {
                const YT = await ensureApi();
                if (!mounted) return;

                if (playerRef.current && typeof playerRef.current.destroy === "function") {
                    try { playerRef.current.destroy(); } catch { /* noop */ }
                    playerRef.current = null;
                }

                playerRef.current = new YT.Player(playerContainerRef.current, {
                    width: "100%",
                    height: "100%",
                    videoId: ytId,
                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        modestbranding: 1,
                        rel: 0,
                        iv_load_policy: 3,
                        disablekb: 1,
                        playsinline: 1,
                        fs: 0,
                        enablejsapi: 1,
                        widget_referrer: window.location.origin,
                    },
                    events: {
                        onReady: (ev) => {
                            if (!mounted) return;
                            setReady(true);
                            const p = ev.target;
                            try {
                                const d = p.getDuration ? p.getDuration() : 0;
                                if (d && Number.isFinite(d)) setDuration(d);
                                setMuted(p.isMuted ? p.isMuted() : false);

                                try {
                                    const q = p.getAvailableQualityLevels ? p.getAvailableQualityLevels() : [];
                                    if (Array.isArray(q) && q.length) {
                                        setQualityLevels(q);
                                        setQualitySelected(q[0]);
                                    } else {
                                        setQualityLevels([]);
                                        setQualitySelected("auto");
                                    }
                                } catch {
                                    setQualityLevels([]);
                                    setQualitySelected("auto");
                                }
                            } catch (e) {
                                console.warn("YT Player ready handler failed", e);
                            }
                        },
                        onStateChange: (e) => {
                            if (!mounted) return;
                            const s = e.data;
                            if (s === 1) {
                                setPlaying(true);
                                startRaf();
                                setShowPoster(false);
                            } else if (s === 2) {
                                setPlaying(false);
                                stopRaf();
                                setShowPoster(true);
                            } else if (s === 0) {
                                setPlaying(false);
                                stopRaf();
                                setShowPoster(true);
                            } else {
                                try {
                                    const p = playerRef.current;
                                    const d = p && p.getDuration ? p.getDuration() : duration;
                                    if (d && Number.isFinite(d) && d !== duration) setDuration(d);
                                } catch { /* noop */ }
                            }
                        },
                    },
                });
            } catch (err) {
                console.warn("YT API load failed", err);
            }
        })();

        return () => {
            mounted = false;
            stopRaf();
            if (playerRef.current && typeof playerRef.current.destroy === "function") {
                try { playerRef.current.destroy(); } catch { /* noop */ }
                playerRef.current = null;
            }
        };
    }, [ytId, url]);
    const startRaf = () => {
        stopRaf();
        const loop = () => {
            try {
                const p = playerRef.current;
                if (p && p.getCurrentTime) {
                    const t = p.getCurrentTime();
                    setCurrent(t);
                    const d = p.getDuration ? p.getDuration() : duration;
                    if (d && Number.isFinite(d) && d !== duration) setDuration(d);
                }
            } catch { /* noop */ }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
    };
    const stopRaf = () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    const togglePlay = () => {
        const p = playerRef.current;
        if (!p || !p.getPlayerState) return;
        const state = p.getPlayerState();
        if (state === 1) {
            p.pauseVideo();
        } else {
            setShowPoster(false);
            p.playVideo();
        }
    };

    const toggleMute = () => {
        const p = playerRef.current;
        if (!p) return;
        if (p.isMuted && p.isMuted()) {
            p.unMute();
            setMuted(false);
        } else if (p.mute) {
            p.mute();
            setMuted(true);
        }
    };

    const handleSeek = (val) => {
        const p = playerRef.current;
        if (!p || !p.seekTo) return;
        const at = Number(val) || 0;
        p.seekTo(at, true);
        setCurrent(at);
    };

    const openQualityMenu = async () => {
        try {
            const p = playerRef.current;
            let q = [];
            if (p && p.getAvailableQualityLevels) {
                q = p.getAvailableQualityLevels() || [];
            }
            if (Array.isArray(q) && q.length) {
                setQualityLevels(q);
            } else {
                setQualityLevels([]);
            }
        } catch {
            setQualityLevels([]);
        } finally {
            setQualityMenuOpen(true);
        }
    };

    const setQuality = (q) => {
        try {
            const p = playerRef.current;
            if (!p) return;
            if (q === "auto") {
                try { p.setPlaybackQuality && p.setPlaybackQuality("default"); } catch { try { p.setPlaybackQuality && p.setPlaybackQuality("auto"); } catch { /* noop */ } }
            } else {
                p.setPlaybackQuality && p.setPlaybackQuality(q);
            }
            setQualitySelected(q);
        } catch (err) {
            console.warn("Failed to set quality", err);
        } finally {
            setQualityMenuOpen(false);
        }
    };

    const toggleFullscreen = async () => {
        if (!rootRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await rootRef.current.requestFullscreen?.();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen?.();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.warn("Fullscreen toggling failed", err);
        }
    };

    useEffect(() => {
        const onFs = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", onFs);
        return () => document.removeEventListener("fullscreenchange", onFs);
    }, []);

    useEffect(() => {
        if (!qualityMenuOpen) return;
        const onDoc = (ev) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(ev.target)) setQualityMenuOpen(false);
        };
        document.addEventListener("pointerdown", onDoc);
        return () => document.removeEventListener("pointerdown", onDoc);
    }, [qualityMenuOpen]);

    if (!url) {
        return <div className="p-3 text-sm text-black/60">No external video provided</div>;
    }
    if (!ytId) {
        return (
            <div ref={rootRef} className="w-full h-full flex flex-col bg-black">
                <div className="relative flex-1 min-h-0">
                    <iframe
                        title="External Video"
                        src={url}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="autoplay; fullscreen; encrypted-media"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        className="block w-full h-full"
                        style={{ background: "black" }}
                    />
                    <div className="absolute inset-0" style={{ zIndex: 50, background: "transparent", pointerEvents: "auto" }} />
                </div>
                <div className="px-3 py-2 bg-slate-900 text-white flex items-center gap-3">
                    <div className="px-2 text-sm">External video</div>
                </div>
            </div>
        );
    }

    return (
        <div ref={rootRef} className="w-full h-full flex flex-col bg-black">
            {/* video area */}
            <div className="relative flex-1 min-h-0">
                <div
                    ref={playerContainerRef}
                    className="w-full h-full"
                    style={{ display: showPoster ? "none" : "block", zIndex: 10 }}
                />

                {showPoster && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black bg-cover bg-center"
                        style={{
                            zIndex: 80,
                            backgroundImage: posterUrls.length ? `url(${posterUrls[0]})` : undefined,
                        }}
                        aria-hidden
                    >
                        <div className="absolute inset-0 bg-black/50" />
                        <button
                            onClick={() => {
                                setShowPoster(false);
                                try { playerRef.current && playerRef.current.playVideo(); } catch { /* noop */ }
                            }}
                            className="relative z-90 p-4 rounded-full bg-white/10 hover:bg-white/20"
                            aria-label="Play"
                        >
                            <FaPlay size={24} />
                        </button>
                    </div>
                )}
                <div
                    className="absolute inset-0"
                    style={{ zIndex: 70, background: "transparent", pointerEvents: "auto" }}
                />
            </div>

            <div className="px-3 py-2 bg-slate-900 text-white flex items-center gap-3" style={{ userSelect: "none", zIndex: 90 }}>
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "Pause" : "Play"}
                    className="flex items-center justify-center rounded p-2 hover:bg-white/10"
                >
                    {playing ? <FaPause size={16} /> : <FaPlay size={16} />}
                </button>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="text-xs w-12 text-left">{formatTime(current)}</div>
                    <input
                        aria-label="timeline"
                        className="flex-1 h-2 appearance-none rounded-lg bg-white/20"
                        type="range"
                        min={0}
                        max={Math.max(0, duration || 0)}
                        step={0.1}
                        value={Number(current || 0)}
                        onChange={(e) => handleSeek(e.target.value)}
                    />
                    <div className="text-xs w-12 text-right">{formatTime(duration)}</div>
                </div>

                <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                    className="flex items-center justify-center rounded p-2 hover:bg-white/10"
                >
                    {muted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                </button>

                <div className="relative">
                    <button
                        type="button"
                        onClick={openQualityMenu}
                        aria-label="Quality"
                        className="flex items-center justify-center rounded p-2 hover:bg-white/10"
                    >
                        <FaCog size={16} />
                    </button>

                    {qualityMenuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-lg overflow-hidden"
                            style={{ zIndex: 110 }}
                        >
                            <div className="text-xs px-3 py-2 border-b font-medium">Quality</div>
                            <div className="max-h-48 overflow-auto">
                                <button
                                    onClick={() => setQuality("auto")}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${qualitySelected === "auto" ? "bg-slate-100 font-semibold" : ""}`}
                                >
                                    Auto
                                </button>

                                {(qualityLevels && qualityLevels.length ? qualityLevels : FALLBACK_QUALITIES.filter(q => q !== "auto")).map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setQuality(q)}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${qualitySelected === q ? "bg-slate-100 font-semibold" : ""}`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={toggleFullscreen}
                    aria-label="Fullscreen"
                    className="flex items-center justify-center rounded p-2 hover:bg-white/10"
                >
                    {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
                </button>
            </div>
        </div>
    );
}
