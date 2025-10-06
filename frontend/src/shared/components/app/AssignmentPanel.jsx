import React, { useEffect, useState } from "react";
import { listAssignmentsByTopicAPI, updateAssignmentAPI } from "@/entities/classroom/model/classroomAPI";
import AssignmentCard from "./AssignmentCard";
import { useSelector } from "react-redux";
import Loading from "@/shared/components/navigation/Loading";
import { toast } from "react-hot-toast";

export default function AssignmentPanel({ topicId, assignments: initial = [], refresh = () => { } }) {
    const token = useSelector((s) => s.auth?.token);
    const [assignments, setAssignments] = useState(initial || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setAssignments(initial || []);
    }, [initial]);

    useEffect(() => {
        if (!topicId) return;
        let mounted = true;
        setLoading(true);
        listAssignmentsByTopicAPI(topicId, token)
            .then((res) => {
                if (!mounted) return;
                setAssignments(Array.isArray(res) ? res : res?.data ?? []);
            })
            .catch((err) => {
                console.error("load assignments", err);
                toast.error("Failed to load assignments");
            })
            .finally(() => mounted && setLoading(false));
        return () => (mounted = false);
    }, [topicId, token]);

    const togglePublish = async (a) => {
        try {
            const updated = await updateAssignmentAPI(a._id, { publish: !a.publish }, token, false);
            setAssignments((prev) => prev.map((p) => (String(p._id) === String(updated._id) ? updated : p)));
            toast.success("Updated");
            refresh();
        } catch (err) {
            console.error("toggle publish", err);
            toast.error("Failed to update");
        }
    };

    if (loading) return <div className="p-4"><Loading /></div>;

    return (
        <div className="p-3 h-full overflow-auto">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Assignments</h3>
                <div className="text-xs text-slate-400">{assignments.length}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                {assignments.length === 0 && <div className="text-sm text-slate-500">No assignments</div>}
                {assignments.map((a) => (
                    <AssignmentCard
                        key={a._id}
                        assignment={a}
                        onTogglePublish={() => togglePublish(a)}
                    />
                ))}
            </div>
        </div>
    );
}
