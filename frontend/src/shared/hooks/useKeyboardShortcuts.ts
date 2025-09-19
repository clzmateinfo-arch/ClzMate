// src/shared/hooks/useKeyboardShortcuts.js
import { useEffect, useRef } from "react";

export default function useKeyboardShortcuts({ onTogglePlay, onSeek, onNext, onPrev }) {
    const ref = useRef({ onTogglePlay, onSeek, onNext, onPrev });
    useEffect(() => { ref.current = { onTogglePlay, onSeek, onNext, onPrev }; }, [onTogglePlay, onSeek, onNext, onPrev]);

    useEffect(() => {
        const handler = (e) => {
            // don't react when user is typing in input/textarea
            const tag = (e.target && e.target.tagName) || "";
            if (["INPUT", "TEXTAREA"].includes(tag)) return;

            if (e.code === "Space") {
                e.preventDefault();
                ref.current.onTogglePlay && ref.current.onTogglePlay();
            } else if (e.code === "ArrowLeft") {
                e.preventDefault();
                ref.current.onSeek && ref.current.onSeek(-10);
            } else if (e.code === "ArrowRight") {
                e.preventDefault();
                ref.current.onSeek && ref.current.onSeek(+10);
            } else if (e.key === "n") {
                ref.current.onNext && ref.current.onNext();
            } else if (e.key === "p") {
                ref.current.onPrev && ref.current.onPrev();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);
}
