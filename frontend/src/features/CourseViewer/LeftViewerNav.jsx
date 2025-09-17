// src/features/courseViewer/LeftViewerNav.jsx
import React from "react";
import { FiGrid, FiMonitor, FiLayers, FiFileText } from "react-icons/fi";
import { useLocation } from "react-router-dom";

export default function LeftViewerNav() {
    return (
        <nav className="w-20 h-screen bg-slate-900/70 border-r border-slate-800 flex flex-col items-center py-6 gap-4">
            <div className="text-white text-xs -rotate-90 whitespace-nowrap mt-2">Viewer</div>
            {/* icons are just decorative - layout toggles are inside page so this nav is minimal */}
            <button title="Split" className="p-3 rounded hover:bg-slate-800/40"><FiGrid size={18} /></button>
            <button title="Focused" className="p-3 rounded hover:bg-slate-800/40"><FiMonitor size={18} /></button>
            <button title="Stack" className="p-3 rounded hover:bg-slate-800/40"><FiLayers size={18} /></button>

            <div className="mt-auto">
                <button title="Course details" className="p-3 rounded-full bg-indigo-600 text-white shadow"> <FiFileText /> </button>
            </div>
        </nav>
    );
}
