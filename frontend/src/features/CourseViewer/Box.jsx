import { useEffect, useState, useRef } from "react";

export default function Box({
    box,
    component: Component,
    componentProps = {},
    onPointerDownDrag,
    onPointerDownResize,
    toggleBox,
    onBringToFront,
}) {
    const [isMobile, setIsMobile] = useState(false);
    const [maximized, setMaximized] = useState(false);
    const [present, setPresent] = useState(false);
    const headerRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const onFsChange = () => {
            if (!document.fullscreenElement) setPresent(false);
        };
        document.addEventListener("fullscreenchange", onFsChange);
        return () => document.removeEventListener("fullscreenchange", onFsChange);
    }, []);

    useEffect(() => {
        if (!present) return;
        const onKey = (e) => {
            const isMac = navigator.platform.toLowerCase().includes("mac");
            const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
            if (ctrlKey && (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S")) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (e.key === "F12") {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        window.addEventListener("keydown", onKey, true);
        return () => window.removeEventListener("keydown", onKey, true);
    }, [present]);

    const containerStyle = (() => {
        if (maximized || isMobile) {
            return {
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: (box.z ?? 30) + 1000,
            };
        }
        return {
            position: "absolute",
            top: `${box.top}vh`,
            left: `${box.left}vw`,
            width: `${box.width}vw`,
            height: `${box.height}vh`,
            zIndex: box.z ?? 30,
        };
    })();

    const headerPointerDown = (e) => {
        const target = e.target;
        if (
            target &&
            (target.closest("button") ||
                target.closest("a") ||
                target.closest("input") ||
                target.closest("svg"))
        ) {
            onBringToFront && onBringToFront(box.id);
            return;
        }
        try {
            e.currentTarget.setPointerCapture?.(e.pointerId);
        } catch (err) { }
        onBringToFront && onBringToFront(box.id);
        if (onPointerDownDrag) onPointerDownDrag(e, box.id);
    };

    const canPresent = (() => {
        const r = componentProps?.resource;
        if (r) {
            const mt = (r.mimeType || "").toLowerCase();
            const name = (r.originalName || "").toLowerCase();
            if (mt === "application/pdf" || name.endsWith(".pdf")) return true;
        }
        const sub = componentProps?.sub;
        if (sub && Array.isArray(sub.supportMaterials)) {
            const found = sub.supportMaterials.find((s) => {
                const mt = (s.mimeType || "").toLowerCase();
                const name = (s.originalName || "").toLowerCase();
                return mt === "application/pdf" || name.endsWith(".pdf") || !!s.isMainPdf;
            });
            if (found) return true;
        }
        return false;
    })();

    const collapsedKey = `collapsedPos:${box.id}`;
    const parseStoredPos = () => {
        try {
            const raw = localStorage.getItem(collapsedKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.x === "number" && typeof parsed.y === "number") return parsed;
            return null;
        } catch (e) {
            return null;
        }
    };

    const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;

    const computeDefaultCollapsedPx = () => {
        const leftNumeric = typeof box.left === "number" ? box.left : 80;
        const widthNumeric = typeof box.width === "number" ? box.width : 15;
        const topNumeric = typeof box.top === "number" ? box.top : 10;
        const leftPx = Math.min(vw * 0.92, ((leftNumeric + widthNumeric + 1) / 100) * vw);
        const topPx = Math.max(8, (topNumeric / 100) * vh);
        return { x: leftPx, y: topPx };
    };

    const stored = typeof window !== "undefined" ? parseStoredPos() : null;
    const [collapsedPos, setCollapsedPos] = useState(stored || computeDefaultCollapsedPx());
    const dragRef = useRef(null);

    useEffect(() => {
        const storedNow = parseStoredPos();
        if (!storedNow) setCollapsedPos(computeDefaultCollapsedPx());
    }, [box.left, box.top, box.width, box.height]);

    const onPointerDownCollapsed = (e) => {
        e.stopPropagation();
        try {
            e.currentTarget.setPointerCapture?.(e.pointerId);
        } catch (err) { }
        onBringToFront && onBringToFront(box.id);

        const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);

        dragRef.current = {
            startX: clientX,
            startY: clientY,
            startPos: { ...collapsedPos },
            dragging: false,
            moved: false,
        };

        window.addEventListener("pointermove", onPointerMoveCollapsed);
        window.addEventListener("pointerup", onPointerUpCollapsed);
        window.addEventListener("touchmove", onPointerMoveCollapsed, { passive: false });
        window.addEventListener("touchend", onPointerUpCollapsed);
    };

    const onPointerMoveCollapsed = (ev) => {
        if (!dragRef.current) return;
        ev.preventDefault?.();
        const clientX = ev.clientX ?? (ev.touches && ev.touches[0] && ev.touches[0].clientX);
        const clientY = ev.clientY ?? (ev.touches && ev.touches[0] && ev.touches[0].clientY);
        if (clientX == null || clientY == null) return;
        const dx = clientX - dragRef.current.startX;
        const dy = clientY - dragRef.current.startY;
        const distSq = dx * dx + dy * dy;
        if (!dragRef.current.moved && distSq > 5 * 5) {
            dragRef.current.moved = true;
            dragRef.current.dragging = true;
        }
        const next = {
            x: Math.max(8, Math.min(vw - 48, dragRef.current.startPos.x + dx)),
            y: Math.max(8, Math.min(vh - 48, dragRef.current.startPos.y + dy)),
        };
        setCollapsedPos(next);
    };

    const onPointerUpCollapsed = () => {
        if (!dragRef.current) {
            cleanupCollapsedListeners();
            return;
        }
        const { dragging } = dragRef.current;
        const xPerc = (collapsedPos.x / vw) * 100;
        const yPerc = (collapsedPos.y / vh) * 100;
        localStorage.setItem(collapsedKey, JSON.stringify({ x: collapsedPos.x, y: collapsedPos.y, xp: xPerc, yp: yPerc }));

        const savedRef = { ...dragRef.current };
        setTimeout(() => {
            dragRef.current = null;
        }, 30);

        cleanupCollapsedListeners();
        return dragging;
    };

    const cleanupCollapsedListeners = () => {
        window.removeEventListener("pointermove", onPointerMoveCollapsed);
        window.removeEventListener("pointerup", onPointerUpCollapsed);
        window.removeEventListener("touchmove", onPointerMoveCollapsed);
        window.removeEventListener("touchend", onPointerUpCollapsed);
    };

    const onCollapsedClick = (e) => {
        e.stopPropagation();
        if (dragRef.current && dragRef.current.dragging) {
            return;
        }
        toggleBox && toggleBox(box.id);
        onBringToFront && onBringToFront(box.id);
    };

    if (!box.visible) {
        const style = {
            position: "fixed",
            left: collapsedPos.x,
            top: collapsedPos.y,
            transform: "translate(-50%, -50%)",
            zIndex: (box.z ?? 30) + 50,
        };

        const collapsedLabel = (box.title || box.id || "Box")
            .split(" ")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

        return (
            <div key={`collapsed-${box.id}`} style={style}>
                <button
                    aria-label={`Show ${box.title || box.id}`}
                    onClick={onCollapsedClick}
                    onPointerDown={onPointerDownCollapsed}
                    onTouchStart={onPointerDownCollapsed}
                    className="group relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg
                     bg-gradient-to-tr from-[#6300b9] to-[#996bec] text-white
                     transform transition-transform duration-300 ease-out hover:scale-110 focus:outline-none"
                    style={{ touchAction: "none" }}
                >
                    <span className="font-semibold select-none">{collapsedLabel}</span>

                    <span
                        className="absolute right-full mr-3 hidden select-none rounded-md px-3 py-1 text-sm font-medium text-white backdrop-blur-sm bg-black/50 border border-white/6 opacity-0 transform translate-x-2 group-hover:flex group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                        aria-hidden
                    >
                        {box.title}
                    </span>
                </button>
            </div>
        );
    }

    return (
        <>
            <div
                key={box.id}
                style={containerStyle}
                className="bg-white/0 border border-slate-800 shadow-xl rounded-none overflow-hidden transition-transform transition-opacity duration-300 ease-out transform opacity-100 scale-100"
                role="group"
            >
                <div
                    ref={headerRef}
                    onPointerDown={headerPointerDown}
                    onPointerUp={(e) => {
                        try {
                            e.currentTarget.releasePointerCapture?.(e.pointerId);
                        } catch (err) { }
                    }}
                    className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#4b2b7a] via-[#7b3ed9] to-[#4629a6] text-white cursor-move select-none"
                    style={{ userSelect: "none" }}
                >
                    <div className="flex items-center gap-3">
                        <div className="font-medium">{box.title}</div>
                    </div>

                    <div className="flex items-center gap-2">
                        {canPresent && (
                            <button
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    onBringToFront && onBringToFront(box.id);
                                    try {
                                        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                                            document.documentElement.requestFullscreen().catch(() => { });
                                        }
                                    } catch (err) { }
                                    setPresent(true);
                                }}
                                className="px-2 py-1 rounded bg-white/5 text-sm hover:bg-white/8"
                                title="Present"
                            >
                                Present
                            </button>
                        )}

                        <button
                            onClick={(ev) => {
                                ev.stopPropagation();
                                onBringToFront && onBringToFront(box.id);
                                setMaximized((m) => !m);
                            }}
                            className="px-2 py-1 rounded bg-white/5 text-sm hover:bg-white/8"
                            title={maximized ? "Restore" : "Maximize"}
                        >
                            {maximized ? "Restore" : "Max"}
                        </button>

                        <button
                            onClick={(ev) => {
                                ev.stopPropagation();
                                onBringToFront && onBringToFront(box.id);
                                toggleBox && toggleBox(box.id);
                            }}
                            className="px-2 py-1 rounded bg-slate-700 text-sm hover:bg-slate-600"
                            title="Hide"
                        >
                            Hide
                        </button>
                    </div>
                </div>

                <div className="w-full h-[calc(100%-42px)] bg-black flex flex-col overflow-hidden">
                    <div className="w-full h-full">
                        {Component ? (
                            <div className="w-full h-full">
                                <Component {...componentProps} presentMode={false} onExitPresent={() => setPresent(false)} />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">No component</div>
                        )}
                    </div>
                </div>

                {!isMobile && (
                    <div
                        onPointerDown={(e) => {
                            try {
                                e.currentTarget.setPointerCapture?.(e.pointerId);
                            } catch (err) { }
                            onBringToFront && onBringToFront(box.id);
                            if (onPointerDownResize) onPointerDownResize(e, box.id);
                        }}
                        onPointerUp={(e) => {
                            try {
                                e.currentTarget.releasePointerCapture?.(e.pointerId);
                            } catch (err) { }
                        }}
                        className="absolute right-0 bottom-0 w-6 h-6 cursor-se-resize"
                        aria-hidden
                    >
                        <div className="w-6 h-6 flex items-end justify-end pr-1 pb-1 opacity-80">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-60">
                                <path d="M4 20L20 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {present && (
                <div
                    className="fixed inset-0 z-[9999] bg-black text-white flex flex-col"
                    onContextMenu={(e) => e.preventDefault()}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/6">
                        <div className="flex items-center gap-3">
                            <div className="text-sm font-semibold">
                                {componentProps?.resource?.originalName ||
                                    (componentProps?.sub &&
                                        (() => {
                                            const found = (componentProps.sub.supportMaterials || []).find(
                                                (s) =>
                                                    s.isMainPdf ||
                                                    (s.mimeType || "").toLowerCase() === "application/pdf" ||
                                                    (s.originalName || "").toLowerCase().endsWith(".pdf")
                                            );
                                            return found?.originalName || "Document";
                                        })())}
                            </div>
                            <div className="text-xs text-slate-400">Present mode</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    try {
                                        if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
                                    } catch (e) { }
                                    setPresent(false);
                                }}
                                className="px-3 py-1 rounded bg-white/6 text-sm"
                                title="Exit present"
                            >
                                Exit
                            </button>
                            <button
                                onClick={() => {
                                    const url =
                                        componentProps?.resource?.url ||
                                        (componentProps?.sub &&
                                            (() => {
                                                const found = (componentProps.sub.supportMaterials || []).find(
                                                    (s) =>
                                                        s.isMainPdf ||
                                                        (s.mimeType || "").toLowerCase() === "application/pdf" ||
                                                        (s.originalName || "").toLowerCase().endsWith(".pdf")
                                                );
                                                return found?.url;
                                            })());
                                    if (url) window.open(url, "_blank", "noopener");
                                }}
                                className="px-3 py-1 rounded bg-white/6 text-sm"
                                title="Open raw"
                            >
                                Open
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
                        {Component ? (
                            <div className="w-full h-full">
                                <Component
                                    {...componentProps}
                                    presentMode={true}
                                    onExitPresent={() => {
                                        try {
                                            if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
                                        } catch (e) { }
                                        setPresent(false);
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">No component</div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
