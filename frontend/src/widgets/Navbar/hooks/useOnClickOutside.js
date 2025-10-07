/* eslint-disable no-unused-vars */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function useOnClickOutside(ref, handler) {
    useEffect(() => {
        const listener = (e) => {
            if (!ref.current || ref.current.contains(e.target)) return;
            handler(e);
        };
        document.addEventListener("mousedown", listener);
        return () => document.removeEventListener("mousedown", listener);
    }, [ref, handler, useLocation().pathname]);
}
