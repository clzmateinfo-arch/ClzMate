import React, { useState } from "react";
import UsersPanel from "@/features/admin/ui/UsersPanel";
import CategoriesPanel from "@/features/admin/ui/CategoriesPanel";

export default function AdminPage() {
    const [tab, setTab] = useState("users");
    return (
        <div className="min-h-screen p-6 bg-slate-900 text-white">
            <div className="max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold">Admin Console</h1>
                    <div className="flex gap-2">
                        <button onClick={() => setTab("users")} className={`px-3 py-1 rounded ${tab === "users" ? "bg-indigo-600" : "bg-white/5"}`}>Users</button>
                        <button onClick={() => setTab("categories")} className={`px-3 py-1 rounded ${tab === "categories" ? "bg-indigo-600" : "bg-white/5"}`}>Categories</button>
                    </div>
                </div>

                <div>{tab === "users" ? <UsersPanel /> : <CategoriesPanel />}</div>
            </div>
        </div>
    );
}
