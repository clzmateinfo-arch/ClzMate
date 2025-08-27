import { useEffect, useRef, useState } from "react";
import { showToast } from "@/shared/components/feedback/CustomToast";

export default function useSublinks(source) {
    const cacheRef = useRef(new Map());
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!source) return setItems([]);

            if (Array.isArray(source)) {
                setItems(source);
                return;
            }

            if (typeof source === "function") {
                const cacheKey = source;
                if (cacheRef.current.has(cacheKey)) {
                    setItems(cacheRef.current.get(cacheKey));
                    return;
                }

                try {
                    setLoading(true);
                    const res = await source();
                    if (!mounted) return;
                    const normalized = Array.isArray(res) ? res : [];
                    cacheRef.current.set(cacheKey, normalized);
                    setItems(normalized);
                } catch (err) {
                    console.error("useSublinks error:", err);
                    if (!mounted) return;
                    setError(err);
                    setItems([]);
                    showToast("Oops! Could not load submenu items", "error");
                } finally {
                    if (mounted) setLoading(false);
                }
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [source]);

    return { items, loading, error };
}
