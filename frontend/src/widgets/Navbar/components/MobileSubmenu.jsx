import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { showToast } from "@/shared/components/feedback/CustomToast";
import { HiOutlineChevronRight  } from "react-icons/hi2";

const cache = new Map();
const slugify = (v = "") =>
    String(v).toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const normalizeRaw = (s) => {
    if (typeof s === "string") return { label: s, value: s };
    return {
        label: s.name ?? s.title ?? s.label ?? s.id ?? "",
        value: s.id ?? s.slug ?? s.name ?? s.title ?? "",
        raw: s,
    };
};

export default function MobileSubmenu({ source, path, basePath, onClose = () => { } }) {
    const mountedRef = useRef(true);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        mountedRef.current = true;
        (async () => {
            if (!source) {
                setItems([]);
                return;
            }

            if (Array.isArray(source)) {
                setItems(source.map(normalizeRaw));
                return;
            }

            try {
                setLoading(true);
                const key = source;
                if (cache.has(key)) {
                    setItems(cache.get(key).map(normalizeRaw));
                } else {
                    const res = await source();
                    const arr = Array.isArray(res) ? res : (res?.data ?? []);
                    cache.set(key, arr);
                    if (!mountedRef.current) return;
                    setItems(arr.map(normalizeRaw));
                }
            } catch (err) {
                console.error("MobileSubmenu fetch error", err);
                showToast?.("Could not load submenu", "error");
                if (mountedRef.current) setItems([]);
            } finally {
                if (mountedRef.current) setLoading(false);
            }
        })();

        return () => {
            mountedRef.current = false;
        };
    }, [source, useLocation().pathname]);

    if (loading) return <div className="py-2 text-sm text-gray-600">Loading…</div>;
    if (!items || items.length === 0) return <div className="py-2 text-sm text-gray-600">No items</div>;

    const base = path ?? basePath ?? "";

    const buildUrl = (s) => {
        if (typeof s === "string") return `/${slugify(s)}`;

        if (s?.raw?.path) {
            return s.raw.path.startsWith("/") ? s.raw.path : `/${s.raw.path}`;
        }

        if (base) {
            const cleanBase = String(base).replace(/\/+$/g, "");
            const idPart = s.value ?? s.raw?.id ?? s.raw?.slug ?? s.raw?.name ?? s.raw?.title ?? "";
            const cleanPart = slugify(idPart);
            return cleanPart ? `${cleanBase}/${cleanPart}` : cleanBase || "/";
        }

        const candidate = s.value ?? s.label ?? s.raw?.slug ?? s.raw?.id ?? s.raw?.name ?? s.raw?.title;
        return candidate ? `/${slugify(candidate)}` : "/";
    };

    return (
        <div role="menu" aria-label="submenu">
            {items.map((s, i) => {
                const label = typeof s === "string" ? s : s.label ?? s.value ?? "Item";
                const to = buildUrl(s);
                return (
                    <Link
                        key={i}
                        to={to}
                        onClick={onClose}
                        className="block ml-2 text-[15px] leading-7 pb-3 hover:text-violet-600 text-gray-800"
                        role="menuitem"
                    >
                        <HiOutlineChevronRight  className="inline-block mr-2 w-4 h-4 text-violet-600" aria-hidden="true" />
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}
