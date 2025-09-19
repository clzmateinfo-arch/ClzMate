/* eslint-disable react/prop-types */
import React from "react";
import { Link } from "react-router-dom";
import useSublinks from "../hooks/useSublinks";
import Loading from "@/shared/components/navigation/Loading";

const Dropdown = ({ anchorTitle, path, source, open }) => {
    const { items, loading } = useSublinks(source);

    return (
        <div
            className={`bubble-b tail absolute left-1/2 -translate-x-1/2 mt-2 z-50 w-48 rounded-2xl bg-white p-2 text-navy shadow-lg transition-all duration-200 transform origin-top ${open ? "opacity-100 scale-100 translate-y-0 visible pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"}`}
        >
            <div className="rounded-tl w-3 h-3 absolute top-0 left-1/2 -ml-1.5 -mt-1.5 rotate-45 bg-white" />

            {loading ? (
                <div className="py-3 text-center text-sm">
                    <Loading />
                </div>
            ) : items?.length ? (
                items.map((s, i) => {
                    const url = typeof s === "string" ? `/${s}` : `${path.toString().split(" ").join("-").toLowerCase()}/${(s.id || "").toString().split(" ").join("-").toLowerCase()}`;
                    const label = typeof s === "string" ? s : s.name || s.title;
                    return (
                        <Link
                            key={i}
                            to={url}
                            className="relative block whitespace-nowrap px-3 py-2.5 text-sm rounded-lg hover:bg-violet-50/40 hover:text-violet-600 transition-colors"
                        >
                            {label}
                        </Link>
                    );
                })
            ) : (
                <div className="py-2 text-sm">No items</div>
            )}
        </div>
    );
};

export default Dropdown;