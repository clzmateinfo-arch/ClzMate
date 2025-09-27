// src/features/admin/UsersPanel.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { fetchUsers, updateUser, deleteUser } from "../../../entities/admin/model/adminAPI";
import toast from "react-hot-toast";

export default function UsersPanel() {
    const auth = useSelector((s) => s.auth || {});
    const token = auth.token;
    const [q, setQ] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        const data = await fetchUsers(token, { q, page: 1, limit: 200 });
        if (data && data.users) setUsers(data.users);
        setLoading(false);
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const handleRoleChange = async (userId, newRole) => {
        const updated = await updateUser(token, { userId, accountType: newRole });
        if (updated) setUsers((s) => s.map(u => u._id === updated._id ? updated : u));
    };

    const handleToggleActive = async (userId, active) => {
        const updated = await updateUser(token, { userId, active });
        if (updated) setUsers((s) => s.map(u => u._id === updated._id ? updated : u));
    };

    const handleDelete = async (userId) => {
        if (!confirm("Delete user? This cannot be undone.")) return;
        const ok = await deleteUser(token, userId);
        if (ok) setUsers((s) => s.filter(u => u._id !== userId));
    };

    return (
        <div className="bg-slate-800/40 rounded p-4">
            <div className="flex items-center gap-2 mb-4">
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or email" className="px-3 py-2 rounded bg-white/5 w-full" />
                <button onClick={load} className="px-3 py-2 rounded bg-indigo-600">Search</button>
            </div>

            {loading ? (
                <div className="p-6 text-center">Loading...</div>
            ) : (
                <div className="space-y-2">
                    {users.map(u => (
                        <div key={u._id} className="flex items-center gap-3 p-3 bg-white/5 rounded">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                                {(u.preferredName || u.firstName || u.email || "U").slice(0, 2).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="font-medium truncate">{u.preferredName || `${u.firstName || ""} ${u.lastName || ""}`}</div>
                                        <div className="text-xs text-slate-300 truncate">{u.email}</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select value={u.accountType} onChange={(e) => handleRoleChange(u._id, e.target.value)} className="bg-white/6 px-2 py-1 rounded">
                                            <option>Student</option>
                                            <option>Instructor</option>
                                            <option>Admin</option>
                                        </select>

                                        <button onClick={() => handleToggleActive(u._id, !u.active)} className={`px-2 py-1 rounded ${u.active ? "bg-emerald-600" : "bg-yellow-600"}`}>
                                            {u.active ? "Active" : "Inactive"}
                                        </button>

                                        <button onClick={() => handleDelete(u._id)} className="px-2 py-1 rounded bg-red-600">Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {users.length === 0 && !loading && <div className="p-4 text-sm text-slate-300">No users found</div>}
        </div>
    );
}
