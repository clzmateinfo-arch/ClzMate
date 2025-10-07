// frontend/src/features/classroom/ui/Topic/TopicItem.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
    FiChevronDown,
    FiChevronRight,
    FiMoreHorizontal,
    FiTrash2,
    FiEdit,
    FiSearch,
    FiChevronLeft,
    FiChevronRight as FiChevronRightIcon,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "@/shared/components/ui/Button";
import Loading from "@/shared/components/navigation/Loading";
import { toast } from "react-hot-toast";
import {
    createItemAPI,
    deleteItemAPI,
    toggleItemStatusAPI,
    copyItemAPI,
    updateTopicAPI,
    deleteTopicAPI,
    listAssignmentsByTopicAPI,
    updateAssignmentAPI,
    deleteAssignmentAPI,
    listQuizzesByTopicAPI,
    deleteQuizAPI,
    updateQuizAPI,
} from "@/entities/classroom/model/classroomAPI";

import MaterialCard from "./MaterialCard";
import AssignmentCard from "./AssignmentCard";
import QuizCard from "./QuizCard";
import LinkCard from "./LinkCard";
import CourseLinkCard from "./CourseLinkCard";

import MaterialCreateModal from "./MaterialCreateModal";

export default function TopicItem({
    topic,
    onOpen,
    onUpdated,
    token,
    classroomId,
    onRequestEdit,
}) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState(topic.items || []);
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    // small UI states
    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const pageSize = 6;

    const navigate = useNavigate();
    const [materialModalOpen, setMaterialModalOpen] = useState(false);
    const [linkCourseModalOpen, setLinkCourseModalOpen] = useState(false);

    // Keep items in sync when topic prop changes
    useEffect(() => {
        setItems(topic.items || []);
        setPageIndex(0);
    }, [topic]);

    // --- NEW: pre-fetch assignments & quizzes counts once when topic is mounted ---
    // This ensures counts in the header pill reflect assignments/quizzes even before user expands the topic.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!topic?._id || !token) return;
            try {
                // We use Promise.allSettled to tolerate missing endpoints
                const [assignRes, quizRes] = await Promise.allSettled([
                    listAssignmentsByTopicAPI(topic._id, token),
                    typeof listQuizzesByTopicAPI === "function"
                        ? listQuizzesByTopicAPI(topic._id, token)
                        : Promise.resolve([]),
                ]);

                if (cancelled) return;

                const arrA = Array.isArray(assignRes?.value)
                    ? assignRes.value
                    : assignRes?.value?.data ?? assignRes?.value?.assignments ?? [];
                const arrQ = Array.isArray(quizRes?.value)
                    ? quizRes.value
                    : quizRes?.value?.data ?? quizRes?.value?.quizzes ?? [];

                // store results so header can compute correct total
                setAssignments(arrA || []);
                setQuizzes(arrQ || []);
            } catch (err) {
                console.warn("Failed to prefetch assignment/quiz counts for topic header", err);
            }
        })();

        return () => {
            cancelled = true;
        };
        // only run when topic id changes or token changes
    }, [topic?._id, token]);

    // Existing function used when user expands to load full lists (preserves original behaviour)
    const loadAssignmentsAndQuizzes = async () => {
        setLoadingAssignments(true);
        try {
            const [assignRes, quizRes] = await Promise.allSettled([
                listAssignmentsByTopicAPI(topic._id, token),
                typeof listQuizzesByTopicAPI === "function"
                    ? listQuizzesByTopicAPI(topic._id, token)
                    : Promise.resolve([]),
            ]);

            const arrA = Array.isArray(assignRes?.value)
                ? assignRes.value
                : assignRes?.value?.data ?? assignRes?.value?.assignments ?? [];
            const arrQ = Array.isArray(quizRes?.value)
                ? quizRes.value
                : quizRes?.value?.data ?? quizRes?.value?.quizzes ?? [];

            setAssignments(arrA || []);
            setQuizzes(arrQ || []);
        } catch (err) {
            console.error("Failed to load assignments/quizzes", err);
            toast.error(err?.message || "Failed to load assignments/quizzes");
        } finally {
            setLoadingAssignments(false);
        }
    };

    const toggleOpen = () => {
        setOpen((s) => !s);
        // when opening, refresh the lists to get latest items
        if (!open) {
            loadAssignmentsAndQuizzes();
        }
    };

    const openCreateModalFor = (type) => {
        if (type === "material") setMaterialModalOpen(true);
        else if (type === "subsection") setLinkCourseModalOpen(true);
        else setMaterialModalOpen(true);
    };

    const onItemCreated = (created) => {
        if (!created) return;
        if (Array.isArray(created)) {
            setItems((prev) => [...prev, ...created]);
        } else {
            setItems((prev) => [...prev, created]);
        }
        onUpdated && onUpdated();
    };

    const handleDeleteItem = async (it) => {
        if (!confirm("Delete this item?")) return;
        try {
            await deleteItemAPI(topic._id, it._id, token);
            setItems((prev) => prev.filter((i) => String(i._id) !== String(it._id)));
            toast.success("Deleted");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("delete item", err);
            toast.error("Delete failed");
        }
    };

    const handleToggleItemStatus = async (it) => {
        try {
            const updated = await toggleItemStatusAPI(topic._id, it._id, token);
            setItems((prev) =>
                prev.map((p) => (String(p._id) === String(updated._id) ? updated : p))
            );
            toast.success("Status updated");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("toggleItemStatus", err);
            toast.error("Failed to update status");
        }
    };

    const handleCopyItem = async (it) => {
        try {
            await copyItemAPI(topic._id, it._id, topic._id, token);
            await loadAssignmentsAndQuizzes();
            onUpdated && onUpdated();
            toast.success("Copied");
        } catch (err) {
            console.error("copyItem", err);
            toast.error("Copy failed");
        }
    };

    const fallbackEditTopic = async () => {
        const newTitle = prompt("Edit topic title", topic.title) || "";
        if (!newTitle.trim()) return;
        try {
            await updateTopicAPI(topic._id, { title: newTitle.trim() }, token);
            toast.success("Topic updated");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("updateTopic", err);
            toast.error("Update failed");
        }
    };

    const handleDeleteTopic = async () => {
        if (!confirm("Delete this topic? Items and assignments inside will be removed."))
            return;
        try {
            await deleteTopicAPI(topic._id, token);
            toast.success("Topic deleted");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("deleteTopic", err);
            toast.error("Failed to delete topic");
        }
    };

    const handleEditAssignment = (assignment) => {
        const cid = topic.classroom || topic.classroomId || classroomId;
        navigate(`/classroom/${cid}/classwork/assignment/${assignment._id}/edit`);
    };

    const handleDeleteAssignment = async (assignment) => {
        if (!confirm("Delete this assignment? This cannot be undone.")) return;
        try {
            await deleteAssignmentAPI(assignment._id, token);
            setAssignments((prev) => prev.filter((a) => String(a._id) !== String(assignment._id)));
            toast.success("Assignment deleted");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("deleteAssignment", err);
            toast.error("Failed to delete assignment");
        }
    };

    const handleTogglePublishAssignment = async (assignment) => {
        try {
            const updated = await updateAssignmentAPI(
                assignment._id,
                { publish: !assignment.publish },
                token,
                false
            );
            setAssignments((prev) => prev.map((a) => (String(a._id) === String(updated._id) ? updated : a)));
            toast.success("Publish status updated");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("toggle publish", err);
            toast.error("Failed to update publish status");
        }
    };

    const handleEditQuiz = (quiz) => {
        const cid = topic.classroom || topic.classroomId || classroomId;
        navigate(`/classroom/${cid}/classwork/quiz/${quiz._id}/edit`);
    };

    const handleDeleteQuiz = async (quiz) => {
        if (!confirm("Delete this quiz? This cannot be undone.")) return;
        try {
            if (typeof deleteQuizAPI !== "function") throw new Error("deleteQuizAPI not available");
            await deleteQuizAPI(quiz._id, token);
            setQuizzes((prev) => prev.filter((q) => String(q._id) !== String(quiz._id)));
            toast.success("Quiz deleted");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("deleteQuiz", err);
            toast.error(err?.message || "Failed to delete quiz");
        }
    };

    const handleTogglePublishQuiz = async (quiz) => {
        try {
            if (typeof updateQuizAPI !== "function") throw new Error("updateQuizAPI not available");
            const updated = await updateQuizAPI(quiz._id, { publish: !quiz.publish }, token, false);
            setQuizzes((prev) => prev.map((q) => (String(q._id) === String(updated._id) ? updated : q)));
            toast.success("Quiz publish status updated");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("toggleQuizPublish", err);
            toast.error(err?.message || "Failed to update quiz publish");
        }
    };

    // merge items/assignments/quizzes for listing (and for header count)
    const combined = useMemo(() => {
        const normalizedItems = (items || []).map((it) => ({ ...it, __kind: "item" }));
        const normalizedAssignments = (assignments || []).map((a) => ({ ...a, __kind: "assignment" }));
        const normalizedQuizzes = (quizzes || []).map((q) => ({ ...q, __kind: "quiz" }));
        const merged = [...normalizedItems, ...normalizedAssignments, ...normalizedQuizzes];
        merged.sort((a, b) => {
            const ta = new Date(a.createdAt || a.meta?.createdAt || 0).getTime();
            const tb = new Date(b.createdAt || b.meta?.createdAt || 0).getTime();
            return tb - ta;
        });
        return merged;
    }, [items, assignments, quizzes]);

    // filtered results based on search
    const filtered = useMemo(() => {
        const t = (search || "").trim().toLowerCase();
        if (!t) return combined;
        return combined.filter((it) => {
            const title = String(it.title || it.name || "").toLowerCase();
            const instr = String(it.instructions || it.content || "").toLowerCase();
            const type = String(it.type || it.__kind || "").toLowerCase();
            return title.includes(t) || instr.includes(t) || type.includes(t);
        });
    }, [combined, search]);

    // pagination management
    const totalPages = Math.max(1, Math.ceil((filtered.length || 0) / pageSize));
    useEffect(() => {
        if (pageIndex >= totalPages) setPageIndex(totalPages - 1);
        if (pageIndex < 0) setPageIndex(0);
    }, [pageIndex, totalPages]);

    const pageItems = useMemo(() => {
        const start = pageIndex * pageSize;
        return (filtered || []).slice(start, start + pageSize);
    }, [filtered, pageIndex, pageSize]);

    const goPrev = () => setPageIndex((p) => Math.max(0, p - 1));
    const goNext = () => setPageIndex((p) => Math.min(totalPages - 1, p + 1));

    // --- header count: compute from merged sources so it reflects full state ---
    const headerCount = (items?.length || 0) + (assignments?.length || 0) + (quizzes?.length || 0);

    return (
        <article className="relative overflow-hidden rounded-2xl border border-[#efe7ff] bg-white shadow-sm transition my-2">
            <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 cursor-pointer select-none transition hover:bg-[#f8f7ff]"
                onClick={toggleOpen}
                role="button"
                aria-expanded={open}
            >
                <div className="flex items-start sm:items-center gap-3 min-w-0 w-full">
                    <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"} flex-shrink-0`}
                        aria-hidden
                    >
                        {open ? <FiChevronDown className="text-[#7c3aed] text-base md:text-lg" /> : <FiChevronRight className="text-[#7c3aed] text-base md:text-lg" />}
                    </span>

                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#0b1220] min-w-0 truncate text-sm md:text-base">{topic.title}</p>
                        {topic.description ? <p className="text-xs text-[#6b7280] truncate">{topic.description}</p> : null}
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 ring-1 ring-[#e9defc] text-[#4c1d95] font-semibold text-sm min-w-[56px] justify-center">
                        {/* Use headerCount so assignments/quizzes are included */}
                        <span className="text-sm md:text-base">{headerCount}</span>
                        <span className="text-xs md:text-xs text-[#6b7280] ml-1">item(s)</span>
                    </div>

                    <div className="flex items-center gap-1 ml-2 md:ml-3">
                        <button type="button" onClick={(e) => { e.stopPropagation(); if (typeof onRequestEdit === "function") { onRequestEdit(topic); } else { fallbackEditTopic(); } }} title="Edit topic" className="p-1.5 md:p-2 rounded hover:bg-white/8" aria-label="Edit topic"><FiEdit className="text-sm md:text-lg text-[#0b1220]" /></button>

                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteTopic(); }} title="Delete topic" className="p-1.5 md:p-2 rounded hover:bg-white/8" aria-label="Delete topic"><FiTrash2 className="text-sm md:text-lg text-red-600" /></button>

                        <button type="button" onClick={(e) => { e.stopPropagation(); onOpen && onOpen(topic); }} title="Open topic" className="p-1.5 md:p-2 rounded hover:bg-white/8" aria-label="Open topic"><FiMoreHorizontal className="text-sm md:text-lg text-[#0b1220]" /></button>
                    </div>
                </div>
            </div>

            {open && (
                <div className="px-4 py-4 space-y-4 my-4 bg-white/50 border-t border-[#f3eff9]/30">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="light" onClick={(e) => { e.stopPropagation(); navigate(`/classroom/${topic.classroom || topic.classroomId || classroomId}/classwork/manage-assignment/${topic._id}`); }} className="px-3 py-2">Assignment</Button>
                        <Button variant="light" onClick={(e) => { e.stopPropagation(); navigate(`/classroom/${topic.classroom || topic.classroomId || classroomId}/classwork/manage-quiz/${topic._id}`); }} className="px-3 py-2 text-sm">Quiz</Button>
                        <Button variant="light" onClick={(e) => { e.stopPropagation(); openCreateModalFor("material"); }} className="px-3 py-2 text-sm">Material</Button>
                        <Button
                            variant="light"
                            onClick={(e) => {
                                e.stopPropagation();
                                const cid = topic.classroom || topic.classroomId || classroomId;
                                navigate(`/classroom/${cid}/classwork/manage-link-course/${topic._id}`);
                            }}
                            className="px-3 py-2 text-sm"
                        >
                            Link Course
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 my-4">
                        <div className="relative w-full sm:max-w-md">
                            <FiSearch className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search items"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }}
                                className="w-full pl-10 pr-3 py-2 border border-[#efe7ff] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#996bec]/30"
                                aria-label="Search items and assignments"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                            <div className="text-sm text-slate-500">{filtered.length} results</div>
                            <div className="inline-flex items-center gap-2">
                                <button onClick={goPrev} disabled={pageIndex === 0} className="p-2 rounded bg-white/90 border border-[#efe7ff] hover:shadow-sm disabled:opacity-40" aria-label="Previous page"><FiChevronLeft /></button>
                                <div className="text-sm text-slate-600 px-2">{pageIndex + 1}/{totalPages}</div>
                                <button onClick={goNext} disabled={pageIndex >= totalPages - 1} className="p-2 rounded bg-white/90 border border-[#efe7ff] hover:shadow-sm disabled:opacity-40" aria-label="Next page"><FiChevronRightIcon /></button>
                            </div>
                        </div>
                    </div>

                    {loadingAssignments ? (
                        <Loading />
                    ) : (
                        <div className="relative mt-3">
                            <div className="w-full overflow-hidden">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {pageItems.map((it) => {
                                        const key = String(it._id) + (it.__kind || "") + (it.type || "");
                                        if (it.__kind === "assignment") {
                                            return (
                                                <div key={key} className="w-full">
                                                    <AssignmentCard
                                                        assignment={it}
                                                        onEdit={() => handleEditAssignment(it)}
                                                        onDelete={() => handleDeleteAssignment(it)}
                                                        onCopy={() => handleCopyItem(it)}
                                                        onToggle={() => handleTogglePublishAssignment(it)}
                                                        onViewSubmissions={() => {
                                                            navigate(`/classroom/${topic.classroom || topic.classroomId || classroomId}/classwork/assignment/${it._id}/submissions`);
                                                        }}
                                                    />
                                                </div>
                                            );
                                        } else if (it.__kind === "quiz") {
                                            return (
                                                <div key={key} className="w-full">
                                                    <QuizCard
                                                        quiz={it}
                                                        onEdit={() => handleEditQuiz(it)}
                                                        onDelete={() => handleDeleteQuiz(it)}
                                                        onCopy={() => handleCopyItem(it)}
                                                        onToggle={() => handleTogglePublishQuiz(it)}
                                                    />
                                                </div>
                                            );
                                        } else if ((it.type || "").toLowerCase() === "material") {
                                            return (
                                                <div key={key} className="w-full">
                                                    <MaterialCard
                                                        item={it}
                                                        topicId={topic._id}
                                                        token={token}
                                                        onDelete={() => handleDeleteItem(it)}
                                                        onCopy={() => handleCopyItem(it)}
                                                        onToggle={() => handleToggleItemStatus(it)}
                                                        onUpdated={(u) => {
                                                            setItems((prev) => prev.map(p => (String(p._id) === String(u._id) ? u : p)));
                                                            onUpdated && onUpdated();
                                                        }}
                                                    />
                                                </div>
                                            );
                                        } else if ((it.type || "").toLowerCase() === "subsection") {
                                            return (
                                                <div key={key} className="w-full">
                                                    <CourseLinkCard
                                                        item={it}
                                                        onEdit={(e) => {
                                                            e?.stopPropagation?.();
                                                            if (typeof onRequestEdit === "function") onRequestEdit(it);
                                                        }}
                                                        onDelete={() => handleDeleteItem(it)}
                                                        onCopy={() => handleCopyItem(it)}
                                                        onToggle={() => handleToggleItemStatus(it)}
                                                    />
                                                </div>
                                            );
                                        } else if ((it.type || "").toLowerCase() === "link") {
                                            return (
                                                <div key={key} className="w-full">
                                                    <LinkCard
                                                        item={it}
                                                        onEdit={() => {
                                                            if (typeof onRequestEdit === "function") onRequestEdit(it);
                                                        }}
                                                        onDelete={() => handleDeleteItem(it)}
                                                        onCopy={() => handleCopyItem(it)}
                                                    />
                                                </div>
                                            );
                                        } else {
                                            return <React.Fragment key={key}></React.Fragment>;
                                        }
                                    })}
                                </div>
                            </div>

                            {filtered.length === 0 && (
                                <div className="mt-3 text-sm text-slate-500">No items or assignments found.</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <MaterialCreateModal
                open={materialModalOpen}
                topicId={topic._id}
                token={token}
                onClose={() => setMaterialModalOpen(false)}
                onCreated={(created) => {
                    onItemCreated(created);
                    setMaterialModalOpen(false);
                }}
            />
        </article>
    );
}
