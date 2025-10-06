import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getSignedAssetUrl } from "@/entities/course/model/courseDetailsAPI";
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaCog, FaExpand, FaCompress } from "react-icons/fa";

function formatTime(sec = 0) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function ResourceViewer({
  resource,
  course,
  token,
  presentMode = false,
  onExitPresent = () => { },
}) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const isCloudinary = Boolean(
    resource?.publicId ||
    (resource?.url && String(resource.url).includes("res.cloudinary.com"))
  );

  const defaultCloudinaryQualities = [
    { label: "Auto", param: null },
    { label: "1080p", param: "w_1920,h_1080,q_auto" },
    { label: "720p", param: "w_1280,h_720,q_auto" },
    { label: "480p", param: "w_854,h_480,q_auto" },
  ];

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [qualitySelected, setQualitySelected] = useState("Auto");
  const [qualities, setQualities] = useState([]);
  const [srcUrl, setSrcUrl] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!resource) {
        if (mounted) {
          setSignedUrl(null);
          setSrcUrl(null);
        }
        return;
      }

      setLoading(true);
      try {
        if (isCloudinary) {
          const payload = {};
          if (resource.publicId) payload.publicId = resource.publicId;
          else if (resource.url) payload.url = resource.url;
          const signed = await getSignedAssetUrl(
            { ...payload, resourceType: resource.resourceType || "auto", type: "authenticated", format: null },
            token
          );
          const final = typeof signed === "string" ? signed : signed?.url ?? resource.url;
          if (mounted) {
            setSignedUrl(final);
            setSrcUrl(final);
            setQualities(defaultCloudinaryQualities);
            setQualitySelected("Auto");
          }
        } else {
          try {
            const maybeSigned = resource.publicId
              ? await getSignedAssetUrl({ publicId: resource.publicId, resourceType: resource.resourceType || "auto", type: "authenticated" }, token)
              : resource.url
                ? await getSignedAssetUrl({ url: resource.url, resourceType: resource.resourceType || "auto", type: "authenticated" }, token)
                : null;

            const final = typeof maybeSigned === "string" ? maybeSigned : maybeSigned?.url ?? resource.url;
            if (mounted) {
              setSignedUrl(final);
              setSrcUrl(final);
              setQualities([]);
              setQualitySelected("Auto");
            }
          } catch (err) {
            if (mounted) {
              setSignedUrl(resource.url);
              setSrcUrl(resource.url);
              setQualities([]);
              setQualitySelected("Auto");
            }
          }
        }
      } catch (err) {
        console.warn("Failed to resolve signed url, falling back to raw url", err);
        if (mounted) {
          setSignedUrl(resource.url);
          setSrcUrl(resource.url);
          setQualities(isCloudinary ? defaultCloudinaryQualities : []);
          setQualitySelected("Auto");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [resource?.publicId, resource?.url, resource?.resourceType, token, isCloudinary]);

  const mt = (resource.mimeType || "").toLowerCase();
  const name = (resource.originalName || "").toLowerCase();
  const isPdf =
    mt === "application/pdf" ||
    name.endsWith(".pdf") ||
    ((resource.resourceType || "").startsWith("raw") && name.endsWith(".pdf"));
  const isVideo =
    (mt && mt.startsWith("video/")) ||
    /\.(mp4|webm|mov)$/i.test(name) ||
    (srcUrl && /\.(mp4|webm|mov)$/i.test(String(srcUrl)));

  if (isPdf) {
    if (presentMode) {
      return (
        <div className="w-full h-full bg-black flex flex-col">
          <div className="flex-1 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
            <object data={signedUrl || resource.url} type="application/pdf" className="w-full h-full">
              <div className="p-6 text-center text-slate-400">
                Preview unavailable{" "}
                <Link className="text-indigo-400 underline" to={signedUrl || resource.url} target="_blank" rel="noreferrer">
                  Open file
                </Link>
              </div>
            </object>
          </div>
        </div>
      );
    }

    return (
      <object data={signedUrl || resource.url} type="application/pdf" className="w-full h-full">
        <div className="p-6 text-center text-slate-400">
          Preview unavailable{" "}
          <Link className="text-indigo-400 underline" to={signedUrl || resource.url} target="_blank" rel="noreferrer">
            Open file
          </Link>
        </div>
      </object>
    );
  }

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoadedMeta = () => {
      setDuration(v.duration || 0);
      setCurrent(v.currentTime || 0);
      setMuted(v.muted);
      setReady(true);
    };
    const onPlay = () => {
      setPlaying(true);
      startRaf();
    };
    const onPause = () => {
      setPlaying(false);
      stopRaf();
    };
    const onEnded = () => {
      setPlaying(false);
      stopRaf();
    };

    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);

    return () => {
      stopRaf();
      try {
        v.removeEventListener("loadedmetadata", onLoadedMeta);
        v.removeEventListener("play", onPlay);
        v.removeEventListener("pause", onPause);
        v.removeEventListener("ended", onEnded);
      } catch (e) { }
    };
  }, [videoRef.current, srcUrl]);

  const startRaf = () => {
    stopRaf();
    const loop = () => {
      try {
        const v = videoRef.current;
        if (v && !v.paused && !v.ended) {
          setCurrent(v.currentTime || 0);
        }
      } catch (e) { }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };
  const stopRaf = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (!v.paused) await v.pause();
      else {
        const p = v.play();
        if (p && p.then) await p;
      }
    } catch (e) {
      console.warn("Play/pause failed", e);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleSeek = (val) => {
    const v = videoRef.current;
    if (!v) return;
    const at = Number(val) || 0;
    try {
      v.currentTime = at;
      setCurrent(at);
    } catch (e) { }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) await containerRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch (err) {
      console.warn("Fullscreen error", err);
    }
  };

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const switchQuality = async (option) => {
    setQualityMenuOpen(false);
    if (!option) return;
    const v = videoRef.current;
    if (!v) return;
    const wasPlaying = !v.paused && !v.ended;
    const time = v.currentTime || 0;

    try {
      if (isCloudinary) {
        const payload = {};
        if (resource.publicId) payload.publicId = resource.publicId;
        else if (resource.url) payload.url = resource.url;
        const transformParam = option.param ?? null;
        const signed = await getSignedAssetUrl(
          {
            ...payload,
            resourceType: resource.resourceType || "auto",
            type: "authenticated",
            format: transformParam ?? null,
          },
          token
        );

        const newSrc = typeof signed === "string" ? signed : signed?.url ?? srcUrl;
        v.pause();
        v.src = newSrc;
        v.load();

        const onLoaded = () => {
          try {
            v.currentTime = Math.min(time, v.duration || time);
          } catch (e) { }
          if (wasPlaying) {
            const p = v.play();
            if (p && p.then) p.catch(() => { });
          }
          v.removeEventListener("loadedmetadata", onLoaded);
        };
        v.addEventListener("loadedmetadata", onLoaded);

        setSrcUrl(newSrc);
        setQualitySelected(option.label);
      } else {
        if (option.url) {
          const newSrc = option.url;
          v.pause();
          v.src = newSrc;
          v.load();
          const onLoaded = () => {
            try {
              v.currentTime = Math.min(time, v.duration || time);
            } catch (e) { }
            if (wasPlaying) {
              const p = v.play();
              if (p && p.then) p.catch(() => { });
            }
            v.removeEventListener("loadedmetadata", onLoaded);
          };
          v.addEventListener("loadedmetadata", onLoaded);
          setSrcUrl(newSrc);
          setQualitySelected(option.label);
        } else {
          setQualitySelected(option.label || "Auto");
        }
      }
    } catch (err) {
      console.warn("Switch quality error:", err);
    }
  };

  useEffect(() => {
    if (!resource) return;
    if (Array.isArray(resource.variants) && resource.variants.length) {
      const q = resource.variants.map((v) => ({ label: v.label || "variant", url: v.url, param: v.param || null }));
      setQualities(q);
      const def = resource.variants.find((v) => v.default) ?? resource.variants[0];
      setQualitySelected(def?.label || "Auto");
      if (def?.url) setSrcUrl(def.url);
    } else {
      if (!isCloudinary) setQualities([]);
    }
  }, [resource?.variants, isCloudinary]);

  useEffect(() => {
    const onDoc = (ev) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(ev.target)) setQualityMenuOpen(false);
    };
    if (qualityMenuOpen) document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [qualityMenuOpen]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onContext = (e) => e.preventDefault();
    el.addEventListener("contextmenu", onContext);
    return () => el.removeEventListener("contextmenu", onContext);
  }, []);

  if (!isVideo || !srcUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400">
        {loading ? "Loading preview..." : "No video preview available"}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative flex flex-col">
      <div className="relative flex-1 min-h-0">
        <video
          ref={videoRef}
          src={srcUrl}
          poster={course?.thumbnail || undefined}
          className="w-full h-full object-contain"
          playsInline
          controls={false}
          preload="metadata"
        />

        <div
          className="absolute inset-0"
          style={{ zIndex: 40, background: "transparent", pointerEvents: "auto" }}
        />
      </div>

      <div className="px-3 py-2 bg-slate-900 text-white flex items-center gap-3" style={{ userSelect: "none", zIndex: 50 }}>
        <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="flex items-center justify-center rounded p-2 hover:bg-white/10">
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

        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="flex items-center justify-center rounded p-2 hover:bg-white/10">
          {muted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
        </button>

        <div className="relative">
          <button type="button" onClick={() => setQualityMenuOpen((s) => !s)} aria-label="Quality" className="flex items-center justify-center rounded p-2 hover:bg-white/10">
            <FaCog size={16} />
          </button>

          {qualityMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white text-black rounded shadow-lg overflow-hidden" style={{ zIndex: 80 }}>
              <div className="text-xs px-3 py-2 border-b font-medium">Quality</div>
              <div className="max-h-48 overflow-auto">
                {(qualities && qualities.length) ? (
                  qualities.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => switchQuality(q)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${qualitySelected === q.label ? "bg-slate-100 font-semibold" : ""}`}
                    >
                      {q.label}
                    </button>
                  ))
                ) : (
                  <button onClick={() => switchQuality({ label: "Auto", param: null })} className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${qualitySelected === "Auto" ? "bg-slate-100 font-semibold" : ""}`}>
                    Auto
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <button type="button" onClick={toggleFullscreen} aria-label="Fullscreen" className="flex items-center justify-center rounded p-2 hover:bg-white/10">
          {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
        </button>
      </div>
    </div>
  );
}
