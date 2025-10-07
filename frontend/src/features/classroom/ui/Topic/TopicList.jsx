import React, { useEffect, useState, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { FiFilePlus } from "react-icons/fi";
import { IoAddCircleOutline, IoCloseCircleOutline } from "react-icons/io5";
import IconBtn from "@/shared/components/ui/IconBtn";
import Input from "@/shared/components/ui/Input";
import TopicItem from "@/features/classroom/ui/Topic/TopicItem";
import {
    createTopicAPI,
    listTopicsAPI,
    reorderTopicsAPI,
    updateTopicAPI,
} from "@/entities/classroom/model/classroomAPI";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import Loading from "@/shared/components/navigation/Loading";

export default function TopicList({ classroomId, onOpenTopic, search = "" }) {
    const { token } = useSelector((s) => s.auth || {});
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const dragState = useRef({ draggingId: null });
    const inputRef = useRef(null);

    const { register, control, handleSubmit, setValue, reset, formState } = useForm({
        defaultValues: { topicTitle: "" },
    });
    const { errors } = formState;
    const [editTopicId, setEditTopicId] = useState(null);

    const load = useCallback(async () => {
        if (!classroomId) return;
        setLoading(true);
        try {
            const data = await listTopicsAPI(classroomId, token);
            setTopics(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("TopicList.load", err);
            toast.error("Failed to load topics");
        } finally {
            setLoading(false);
        }
    }, [classroomId, token]);

    useEffect(() => {
        load();
    }, [load]);

    const onSubmit = async (form) => {
        const title = (form.topicTitle || "").trim();
        if (!title) return toast.error("Title required");

        setSaving(true);
        try {
            if (editTopicId) {
                const updated = await updateTopicAPI(editTopicId, { title }, token);
                if (!updated) throw new Error("Update failed");
                toast.success("Topic updated");
            } else {
                await createTopicAPI(classroomId, { title }, token);
                toast.success("Topic created");
            }
            reset({ topicTitle: "" });
            setEditTopicId(null);
            await load();
        } catch (err) {
            console.error("save topic", err);
            toast.error(err?.message || "Failed to save topic");
        } finally {
            setSaving(false);
        }
    };

    const handleStartEdit = (topic) => {
        if (!topic) return;
        setEditTopicId(topic._id);
        setValue("topicTitle", topic.title || "");
        setTimeout(() => {
            try {
                inputRef.current?.focus?.();
            } catch (e) {
                console.warn("focus error", e);
            }
        }, 0);
    };

    const cancelEdit = () => {
        setEditTopicId(null);
        reset({ topicTitle: "" });
    };

    const onDragStart = (e, topicId) => {
        e.dataTransfer.setData("text/plain", topicId);
        dragState.current.draggingId = topicId;
    };

    const onDropOnTopic = async (e, targetId) => {
        e.preventDefault();
        const draggingId = dragState.current.draggingId || e.dataTransfer.getData("text/plain");
        if (!draggingId || draggingId === targetId) return;
        const arr = [...topics];
        const fromIdx = arr.findIndex((t) => String(t._id) === String(draggingId));
        const toIdx = arr.findIndex((t) => String(t._id) === String(targetId));
        if (fromIdx === -1 || toIdx === -1) return;
        const [item] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, item);
        setTopics(arr);

        try {
            await reorderTopicsAPI(classroomId, arr.map((t) => t._id), token);
        } catch (err) {
            console.warn("reorder failed", err);
            toast.error("Failed to persist order");
            await load();
        }
    };

    const onDragOver = (e) => e.preventDefault();

    const handleTopicUpdated = async () => {
        await load();
    };

    const filtered = (topics || []).filter((t) => {
        if (!search || !String(search).trim()) return true;
        return (t.title || "").toLowerCase().includes(String(search).toLowerCase());
    });

    return (
        <section>
            <div className="space-y-6 rounded-2xl border border-white/8 bg-white/6 p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="my-2 flex items-end">
                        <Controller
                            name="topicTitle"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="topicTitle"
                                    label={editTopicId ? "Edit Topic" : "Topic Title"}
                                    placeholder="Add a topic"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    error={errors.topicTitle?.message}
                                    className="flex-1"
                                    disabled={loading}
                                />
                            )}
                        />
                        {editTopicId && (
                            <div className="ml-5 mb-[3px] items-center-safe align-middle">
                                <IconBtn
                                    type="button"
                                    onClick={cancelEdit}
                                    disabled={saving}
                                    text={"Cancel Edit"}
                                    outline
                                    customClasses="bg-violet-600"
                                    textClass="text-black"
                                >
                                    <IoCloseCircleOutline size={18} />
                                </IconBtn>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <IconBtn
                            type="submit"
                            disabled={saving}
                            text={editTopicId ? "Save" : "Create Topic"}
                            outline
                            customClasses="bg-violet-600"
                            textClass="text-black"
                        >
                            <IoAddCircleOutline size={16} />
                        </IconBtn>
                    </div>
                </form>

                <div className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-[#0b1220]">Topics</h3>
                            <div className="text-sm text-[#6b7280]">{topics.length} topics</div>
                        </div>

                        <div className="flex items-center gap-3">
                            <IconBtn onClick={() => { }} text="" outline customClasses="bg-white/6 text-black">
                                <FiFilePlus />
                            </IconBtn>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="w-full min-h-[120px] flex items-center justify-center p-4">
                                <Loading />
                            </div>
                        ) : null}

                        {!loading && filtered.length === 0 ? (
                            <div className="text-sm text-center text-[#000000] rounded-2xl p-4">No topics</div>
                        ) : (
                            filtered.map((t) => (
                                <div
                                    key={t._id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, t._id)}
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDropOnTopic(e, t._id)}
                                >
                                    <TopicItem
                                        topic={t}
                                        onUpdated={handleTopicUpdated}
                                        onOpen={() => onOpenTopic && onOpenTopic(t)}
                                        token={token}
                                        classroomId={classroomId}
                                        onRequestEdit={() => handleStartEdit(t)}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
