import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { fetchUsers, updateUser, deleteUser } from "@/entities/admin/model/adminAPI";

import Select from "@/shared/components/ui/Select";
import IconBtn from "@/shared/components/ui/IconBtn";
import { FiTrash2 } from "react-icons/fi";
import { GrStatusDisabled, GrStatusGood } from "react-icons/gr";

export default function UsersPanel({ searchTerm = "" }) {
    const auth = useSelector((s) => s.auth || {});
    const token = auth.token;

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const searchRef = useRef(searchTerm);
    useEffect(() => { searchRef.current = searchTerm; }, [searchTerm]);

    const load = async (q = "") => {
        setLoading(true);
        try {
            const data = await fetchUsers(token, { q, page: 1, limit: 200 });
            if (data && data.users) setUsers(data.users);
            else setUsers([]);
        } catch (err) {
            console.error("Failed to fetch users", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(searchTerm || "");
    }, [searchTerm]);

    const handleRoleChange = async (userId, newRole) => {
        setProcessingId(userId);
        try {
            const updated = await updateUser(token, { userId, accountType: newRole });
            if (updated) setUsers((s) => s.map((u) => (u._id === updated._id ? updated : u)));
        } catch (err) {
            console.error("Failed to update user role", err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleToggleActive = async (userId, active) => {
        setProcessingId(userId);
        try {
            const updated = await updateUser(token, { userId, active });
            if (updated) setUsers((s) => s.map((u) => (u._id === updated._id ? updated : u)));
        } catch (err) {
            console.error("Failed to toggle active", err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm("Delete user? This cannot be undone.")) return;
        setProcessingId(userId);
        try {
            const ok = await deleteUser(token, userId);
            if (ok) setUsers((s) => s.filter((u) => u._id !== userId));
        } catch (err) {
            console.error("Failed to delete user", err);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl p-4 bg-white/6 border border-white/8">
                {loading ? (
                    <div className="p-6 text-center text-sm text-richblack-600">Loading...</div>
                ) : users.length === 0 ? (
                    <div className="p-4 text-sm text-richblack-600">No users found</div>
                ) : (
                    <div className="space-y-3">
                        {users.map((u) => (
                            <div key={u._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white/5 rounded">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-richblack-900 shrink-0">
                                    {(u.preferredName || u.firstName || u.email || "U").slice(0, 2).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-medium truncate text-richblack-900">{u.preferredName || `${u.firstName || ""} ${u.lastName || ""}`}</div>
                                            <div className="text-xs text-richblack-500 truncate">{u.email}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div>
                                                <Select
                                                    value={u.accountType}
                                                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                    options={["Student", "Instructor", "Admin"]}
                                                    placeholder="Role"
                                                    selectClass="text-sm"
                                                />
                                            </div>

                                            <div>
                                                <IconBtn
                                                    onClick={() => handleToggleActive(u._id, !u.active)}
                                                    className="w-full text-sm"
                                                    disabled={processingId === u._id}
                                                    customClasses={u.active ? "bg-emerald-600" : "bg-amber-500"}
                                                    text={u.active ? "Deactivate" : "Activate"}
                                                >
                                                    {u.active ? (<GrStatusGood />) : (<GrStatusDisabled />)}
                                                </IconBtn>
                                            </div>

                                            <div>
                                                <IconBtn
                                                    text="Delete"
                                                    onClick={() => handleDelete(u._id)}
                                                    customClasses="bg-red-600"
                                                >
                                                    <FiTrash2 />
                                                </IconBtn>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
