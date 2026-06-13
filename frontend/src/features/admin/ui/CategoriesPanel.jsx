import { useEffect, useState } from "react";
import {
    fetchCategories,
    createCategory,
    updateCategoryAPI,
    deleteCategoryAPI,
} from "@/entities/admin/model/adminAPI";
import { useSelector } from "react-redux";
import { showToast } from "@/shared/components/feedback/CustomToast";

import Input from "@/shared/components/ui/Input";
import Textarea from "@/shared/components/ui/Textarea";
import Button from "@/shared/components/ui/Button";
import IconBtn from "@/shared/components/ui/IconBtn";
import ConfirmationModal from "@/shared/components/feedback/ConfirmationModal";
import { RiEditBoxLine } from "react-icons/ri";
import { FiTrash2, FiSave, FiX } from "react-icons/fi";

export default function CategoriesPanel() {
    const auth = useSelector((s) => s.auth || {});
    const token = auth.token;

    const [cats, setCats] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState(null);

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
        if (!name.trim()) {
            showToast("Category name is required", "error");
            return;
        }
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
        if (!editName.trim()) {
            showToast("Category name is required", "error");
            return;
        }
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

    const handleDelete = (id) => {
        setConfirmationModal({
            text1: "Delete Category",
            text2: "This action cannot be undone. Are you sure you want to delete this category?",
            btn1Text: "Delete",
            btn2Text: "Cancel",
            btn1Handler: async () => {
                setConfirmationModal(null);
                try {
                    const ok = await deleteCategoryAPI(token, id);
                    if (ok) await load();
                } catch (err) {
                    console.error("Failed to delete category", err);
                }
            },
            btn2Handler: () => setConfirmationModal(null),
        });
    };

    return (
        <>
            <div className="space-y-6">
                <div className="rounded-xl p-6 bg-white/6 border border-white/8">
                    <h3 className="font-semibold text-black text-lg mb-4">
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
                    <h4 className="font-semibold mb-3 text-black">
                        All categories
                    </h4>

                    {loading ? (
                        <div className="p-6 text-center text-sm text-black/60">
                            Loading...
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cats.length === 0 && (
                                <div className="p-4 text-sm text-black/60">
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
                                            <div className="font-medium truncate text-black">
                                                {c.name}
                                            </div>
                                            <div className="text-xs text-black/50 mt-1">
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
                                                    customClasses="bg-slate-500"
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

            {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
        </>
    );
}
