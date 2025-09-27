import React, { useEffect, useState } from "react";
import {
    fetchCategories,
    createCategory,
    updateCategoryAPI,
    deleteCategoryAPI,
} from "@/entities/admin/model/adminAPI";
import { useSelector } from "react-redux";

import Input from "@/shared/components/ui/Input";
import Textarea from "@/shared/components/ui/Textarea";
import Button from "@/shared/components/ui/Button";
import IconBtn from "@/shared/components/ui/IconBtn";
import { RiEditBoxLine } from "react-icons/ri";
import { FiTrash2, FiSave, FiX } from "react-icons/fi";

export default function CategoriesPanel() {
    const auth = useSelector((s) => s.auth || {});
    const token = auth.token;

    const [cats, setCats] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    // inline editing state
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchCategories();
            setCats(data || []);
        } catch (err) {
            console.error("Failed to load categories", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleAdd = async () => {
        if (!name.trim()) return alert("Name required");
        setCreating(true);
        try {
            const ok = await createCategory(token, {
                name: name.trim(),
                description: description.trim(),
            });
            if (ok) {
                setName("");
                setDescription("");
                await load();
            }
        } catch (err) {
            console.error("Failed to create category", err);
        } finally {
            setCreating(false);
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat._id);
        setEditName(cat.name || "");
        setEditDescription(cat.description || "");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditDescription("");
    };

    const saveEdit = async (id) => {
        if (!editName.trim()) return alert("Name required");
        setSaving(true);
        try {
            const updated = await updateCategoryAPI(token, {
                categoryId: id,
                name: editName.trim(),
                description: editDescription.trim(),
            });
            if (updated) {
                await load();
                cancelEdit();
            }
        } catch (err) {
            console.error("Failed to update category", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete category?")) return;
        try {
            const ok = await deleteCategoryAPI(token, id);
            if (ok) await load();
        } catch (err) {
            console.error("Failed to delete category", err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Create Category */}
            <div className="rounded-xl p-6 bg-white/6 border border-white/8">
                <h3 className="font-semibold text-richblack-900 text-lg mb-4">
                    Create Category
                </h3>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAdd();
                    }}
                    className="flex flex-col gap-3"
                >
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Category name"
                        inputClass="text-sm"
                        aria-label="Category name"
                    />

                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short description"
                        rows={2}
                        inputClass="text-sm"
                        aria-label="Category description"
                    />

                    <Button type="submit" disabled={creating} className="w-40">
                        {creating ? "Creating..." : "Create"}
                    </Button>
                </form>
            </div>

            <div className="rounded-xl p-4 bg-white/6 border border-white/8">
                <h4 className="font-semibold mb-3 text-richblack-900">
                    All categories
                </h4>

                {loading ? (
                    <div className="p-6 text-center text-sm text-richblack-600">
                        Loading...
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cats.length === 0 && (
                            <div className="p-4 text-sm text-richblack-600">
                                No categories yet
                            </div>
                        )}

                        {cats.map((c) => (
                            <div
                                key={c._id}
                                className="p-3 bg-white/5 rounded flex flex-col gap-3"
                            >
                                {editingId === c._id ? (
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            value={editName}
                                            onChange={(e) =>
                                                setEditName(e.target.value)
                                            }
                                            placeholder="Category name"
                                            inputClass="text-sm"
                                        />
                                        <Textarea
                                            value={editDescription}
                                            onChange={(e) =>
                                                setEditDescription(e.target.value)
                                            }
                                            placeholder="Category description"
                                            rows={2}
                                            inputClass="text-sm"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <div className="font-medium truncate text-richblack-900">
                                            {c.name}
                                        </div>
                                        <div className="text-xs text-richblack-500 mt-1">
                                            {c.description}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {editingId === c._id ? (
                                        <>
                                            <IconBtn
                                                text={saving ? "Saving..." : "Save"}
                                                onClick={() => saveEdit(c._id)}
                                                customClasses="bg-emerald-600"
                                                disabled={saving}
                                            >
                                                <FiSave />
                                            </IconBtn>

                                            <IconBtn
                                                text="Cancel"
                                                onClick={cancelEdit}
                                                customClasses="bg-yellow-600"
                                            >
                                                <FiX />
                                            </IconBtn>
                                        </>
                                    ) : (
                                        <>
                                            <IconBtn
                                                text="Edit"
                                                onClick={() => startEdit(c)}
                                                customClasses="bg-violet-600"
                                            >
                                                <RiEditBoxLine />
                                            </IconBtn>

                                            <IconBtn
                                                text="Delete"
                                                onClick={() =>
                                                    handleDelete(c._id)
                                                }
                                                customClasses="bg-red-600"
                                            >
                                                <FiTrash2 />
                                            </IconBtn>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
