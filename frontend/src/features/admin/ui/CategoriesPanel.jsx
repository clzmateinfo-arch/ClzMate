// src/features/admin/CategoriesPanel.jsx
import React, { useEffect, useState } from "react";
import { fetchCategories, createCategory, updateCategoryAPI, deleteCategoryAPI } from "../../../entities/admin/model/adminAPI";
import { useSelector } from "react-redux";

export default function CategoriesPanel() {
    const auth = useSelector(s => s.auth || {});
    const token = auth.token;
    const [cats, setCats] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const load = async () => {
        const data = await fetchCategories();
        setCats(data || []);
    };

    useEffect(() => { load(); }, []);

    const handleAdd = async () => {
        if (!name.trim()) return alert("Name required");
        const ok = await createCategory(token, { name, description });
        if (ok) { setName(""); setDescription(""); await load(); }
    };

    const handleUpdate = async (id) => {
        const newName = prompt("New name");
        const newDesc = prompt("New description");
        if (!newName) return;
        const updated = await updateCategoryAPI(token, { categoryId: id, name: newName, description: newDesc });
        if (updated) await load();
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete category?")) return;
        const ok = await deleteCategoryAPI(token, id);
        if (ok) await load();
    };

    return (
        <div className="bg-slate-800/40 rounded p-4">
            <div className="mb-4">
                <h3 className="font-semibold mb-2">Create Category</h3>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full mb-2 px-3 py-2 rounded bg-white/5" />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full mb-2 px-3 py-2 rounded bg-white/5" />
                <button onClick={handleAdd} className="px-3 py-1 rounded bg-indigo-600">Create</button>
            </div>

            <div>
                <h4 className="font-semibold mb-2 mt-5">All categories</h4>
                <div className="space-y-2">
                    {cats.map(c => (
                        <div key={c._id} className="p-3 bg-white/5 rounded flex items-start justify-between mt-5 mb-5">
                            <div className="min-w-0">
                                <div className="font-medium truncate">{c.name}</div>
                                <div className="text-xs text-slate-300 mt-1">{c.description}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleUpdate(c._id)} className="px-2 py-1 rounded bg-white/6">Edit</button>
                                <button onClick={() => handleDelete(c._id)} className="px-2 py-1 rounded bg-red-600">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
