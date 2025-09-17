// src/features/course/hooks/useKeyboardShortcuts.ts
import { useEffect, useRef } from "react";

/**
 * Hook to register keyboard shortcuts:
 * - space: play/pause
 * - ArrowLeft/ArrowRight: seek -/+10s
 * - n: next, p: prev
 *
 * Options object can contain:
 *  - onPlayPause(), onSeek(seconds), onNext(), onPrev()
 */
type KeyboardShortcutsOptions = {
    onPlayPause?: () => void;
    onSeek?: (seconds: number) => void;
    onNext?: () => void;
    onPrev?: () => void;
};

export default function useKeyboardShortcuts({
    onPlayPause,
    onSeek,
    onNext,
    onPrev,
}: KeyboardShortcutsOptions) {
    const ref = useRef({ onPlayPause, onSeek, onNext, onPrev });
    useEffect(() => { ref.current = { onPlayPause, onSeek, onNext, onPrev }; }, [onPlayPause, onSeek, onNext, onPrev]);

    useEffect(() => {
        const handler = (e) => {
            // don't trigger when typing in an input/textarea/contentEditable
            const tag = (e.target && e.target.tagName) || "";
            const editable = e.target && (e.target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");
            if (editable) return;

            // space: play/pause (also prevent page scroll)
            if (e.code === "Space") {
                e.preventDefault();
                ref.current.onPlayPause && ref.current.onPlayPause();
                return;
            }

            if (e.key === "ArrowLeft") {
                ref.current.onSeek && ref.current.onSeek(-10);
                return;
            }
            if (e.key === "ArrowRight") {
                ref.current.onSeek && ref.current.onSeek(10);
                return;
            }
            if (e.key === "n") {
                ref.current.onNext && ref.current.onNext();
                return;
            }
            if (e.key === "p") {
                ref.current.onPrev && ref.current.onPrev();
                return;
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);
}
