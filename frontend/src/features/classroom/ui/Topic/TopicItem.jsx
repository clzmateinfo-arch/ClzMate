// frontend/src/features/classroom/ui/Topic/TopicItem.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
    FiChevronDown,
    FiChevronRight,
    FiMoreHorizontal,
    FiTrash2,
    FiEdit,
    FiSearch,
    FiChevronLeft,
    FiChevronRight as FiChevronRightIcon
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "@/shared/components/ui/Button";
import ItemCard from "@/features/classroom/ui/Topic/ItemCard";
import {
    createItemAPI,
    reorderItemsAPI,
    deleteItemAPI,
    toggleItemStatusAPI,
    copyItemAPI,
    updateTopicAPI,
    deleteTopicAPI,
    listAssignmentsByTopicAPI,
    updateAssignmentAPI,
    deleteAssignmentAPI,
} from "@/entities/classroom/model/classroomAPI";
import Loading from "@/shared/components/navigation/Loading";
import { toast } from "react-hot-toast";

/**
 * TopicItem - shows topic header and an items carousel (items + assignments)
 * Carousel is fixed and uses Prev/Next buttons. Supports up to 2 rows.
 */
export default function TopicItem({ topic, onOpen, onUpdated, token, classroomId, onRequestEdit }) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState(topic.items || []);
    const [assignments, setAssignments] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    // carousel/search state
    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);

    // carousel layout config
    const columnsPerRow = 3; // columns
    const rows = 2; // max rows as requested
    const pageSize = columnsPerRow * rows; // 6 per page

    const navigate = useNavigate();

    useEffect(() => {
        setItems(topic.items || []);
        // reset carousel on topic change
        setPageIndex(0);
    }, [topic]);

    useEffect(() => {
        if (open) loadAssignments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, topic?._id]);

    const loadAssignments = async () => {
        setLoadingAssignments(true);
        try {
            const res = await listAssignmentsByTopicAPI(topic._id, token);
            // normalize response (backend may return array or { data: [] })
            const arr = Array.isArray(res) ? res : res?.data ?? res?.assignments ?? [];
            setAssignments(arr || []);
        } catch (err) {
            console.error("Failed to load assignments", err);
            toast.error(err?.message || "Failed to load assignments");
        } finally {
            setLoadingAssignments(false);
        }
    };

    const toggleOpen = () => {
        setOpen((s) => !s);
        if (!open) {
            // optimistic: load assignments immediately
            loadAssignments();
        }
    };

    // item creation (unchanged)
    const handleCreateItem = async (type) => {
        const title = prompt(`Enter ${type} title`) || "";
        if (!title.trim()) return;
        try {
            const created = await createItemAPI(topic._id, { type, title, content: "" }, token);
            setItems((prev) => [...prev, created]);
            toast.success("Created");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("createItem", err);
            toast.error("Failed to create");
        }
    };

    // delete item (topic item)
    const handleDeleteItem = async (it) => {
        if (!confirm("Delete this item?")) return;
        try {
            await deleteItemAPI(topic._id, it._id, token);
            setItems((prev) => prev.filter(i => String(i._id) !== String(it._id)));
            toast.success("Deleted");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("delete item", err);
            toast.error("Delete failed");
        }
    };

    // toggle publish for topic item
    const handleToggleItemStatus = async (it) => {
        try {
            const updated = await toggleItemStatusAPI(topic._id, it._id, token);
            setItems((prev) => prev.map(p => (String(p._id) === String(updated._id) ? updated : p)));
            toast.success("Status updated");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("toggleItemStatus", err);
            toast.error("Failed to update status");
        }
    };

    // copy item
    const handleCopyItem = async (it) => {
        try {
            await copyItemAPI(topic._id, it._id, topic._id, token);
            await loadAssignments(); // in case copy affects assignments/items
            onUpdated && onUpdated();
            toast.success("Copied");
        } catch (err) {
            console.error("copyItem", err);
            toast.error("Copy failed");
        }
    };

    // topic delete/edit (unchanged)
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
        if (!confirm("Delete this topic? Items and assignments inside will be removed.")) return;
        try {
            await deleteTopicAPI(topic._id, token);
            toast.success("Topic deleted");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("deleteTopic", err);
            toast.error("Failed to delete topic");
        }
    };

    // Assignment-specific actions
    const handleEditAssignment = (assignment) => {
        const cid = topic.classroom || topic.classroomId || classroomId;
        navigate(`/classroom/${cid}/classwork/manage-assignment/${assignment._id}`);
    };

    const handleDeleteAssignment = async (assignment) => {
        if (!confirm("Delete this assignment? This cannot be undone.")) return;
        try {
            await deleteAssignmentAPI(assignment._id, token);
            setAssignments(prev => prev.filter(a => String(a._id) !== String(assignment._id)));
            toast.success("Assignment deleted");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("deleteAssignment", err);
            toast.error("Failed to delete assignment");
        }
    };

    const handleTogglePublishAssignment = async (assignment) => {
        try {
            const updated = await updateAssignmentAPI(assignment._id, { publish: !assignment.publish }, token, false);
            setAssignments(prev => prev.map(a => (String(a._id) === String(updated._id) ? updated : a)));
            toast.success("Publish status updated");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("toggle publish", err);
            toast.error("Failed to update publish status");
        }
    };

    // Combine items + assignments into a single list (assignments might duplicate if also present as topic items; dedupe by id+type)
    const combined = useMemo(() => {
        const normalizedItems = (items || []).map(it => ({ ...it, __kind: 'item' }));
        const normalizedAssignments = (assignments || []).map(a => ({ ...a, __kind: 'assignment' }));
        // naive merge; keep order by createdAt (desc) if present, otherwise items first
        const merged = [...normalizedItems, ...normalizedAssignments];
        // try to sort by createdAt if available
        merged.sort((a, b) => {
            const ta = new Date(a.createdAt || a.meta?.createdAt || 0).getTime();
            const tb = new Date(b.createdAt || b.meta?.createdAt || 0).getTime();
            return tb - ta;
        });
        return merged;
    }, [items, assignments]);

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

    const totalPages = Math.max(1, Math.ceil((filtered.length || 0) / pageSize));
    // ensure pageIndex in range
    useEffect(() => {
        if (pageIndex >= totalPages) setPageIndex(totalPages - 1);
        if (pageIndex < 0) setPageIndex(0);
    }, [pageIndex, totalPages]);

    const pageItems = useMemo(() => {
        const start = pageIndex * pageSize;
        return (filtered || []).slice(start, start + pageSize);
    }, [filtered, pageIndex, pageSize]);

    const goPrev = () => setPageIndex(p => Math.max(0, p - 1));
    const goNext = () => setPageIndex(p => Math.min(totalPages - 1, p + 1));

    return (
        <article className="relative overflow-hidden rounded-2xl border border-[#efe7ff] bg-white shadow-sm transition my-2">
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none transition hover:bg-[#f8f7ff]"
                onClick={toggleOpen}
                role="button"
                aria-expanded={open}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
                        aria-hidden
                    >
                        {open ? <FiChevronDown className="text-[#7c3aed] text-base md:text-lg" /> : <FiChevronRight className="text-[#7c3aed] text-base md:text-lg" />}
                    </span>

                    <div className="min-w-0">
                        <p className="font-semibold text-[#0b1220] min-w-0 truncate text-sm md:text-base">{topic.title}</p>
                        {topic.description ? <p className="text-xs text-[#6b7280] truncate">{topic.description}</p> : null}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 ring-1 ring-[#e9defc] text-[#4c1d95] font-semibold text-sm min-w-[56px] justify-center">
                        <span className="text-sm md:text-base">{(topic.items || []).length}</span>
                        <span className="text-xs md:text-xs text-[#6b7280] ml-1">item(s)</span>
                    </div>

                    <div className="flex items-center gap-1 ml-2 md:ml-3">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (typeof onRequestEdit === "function") {
                                    onRequestEdit(topic);
                                } else {
                                    fallbackEditTopic();
                                }
                            }}
                            title="Edit topic"
                            className="p-1.5 md:p-2 rounded hover:bg-white/8"
                        >
                            <FiEdit className="text-sm md:text-lg text-[#0b1220]" />
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTopic();
                            }}
                            title="Delete topic"
                            className="p-1.5 md:p-2 rounded hover:bg-white/8"
                        >
                            <FiTrash2 className="text-sm md:text-lg text-red-600" />
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpen && onOpen(topic);
                            }}
                            title="Open topic"
                            className="p-1.5 md:p-2 rounded hover:bg-white/8"
                        >
                            <FiMoreHorizontal className="text-sm md:text-lg text-[#0b1220]" />
                        </button>
                    </div>
                </div>
            </div>

            {open && (
                <div className="px-4 py-4 space-y-4 my-4 bg-white/50 border-t border-[#f3eff9]/30">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="light" onClick={() => handleCreateItem("material")} className="px-3 py-2 text-sm">Material</Button>
                        <Button variant="light" onClick={(e) => { e.stopPropagation(); navigate(`/classroom/${topic.classroom || topic.classroomId || classroomId}/classwork/manage-assignment/${topic._id}`); }} className="px-3 py-2">Assignment</Button>
                        <Button variant="light" onClick={() => handleCreateItem("quiz")} className="px-3 py-2 text-sm">Quiz</Button>
                        <Button variant="light" onClick={() => handleCreateItem("quiz")} className="px-3 py-2 text-sm">Stories</Button>
                        <Button variant="light" onClick={() => handleCreateItem("subsection")} className="px-3 py-2 text-sm">Link Course</Button>
                    </div>

                    {/* Search and controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 my-4">
                        <div className="relative w-full sm:max-w-md">
                            <FiSearch className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search items & assignments..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }}
                                className="w-full pl-10 pr-3 py-2 border border-[#efe7ff] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#996bec]/30"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="text-sm text-slate-500">{filtered.length} results</div>
                            <div className="inline-flex items-center gap-2">
                                <button onClick={goPrev} disabled={pageIndex === 0} className="p-2 rounded bg-white/90 border border-[#efe7ff] hover:shadow-sm" aria-label="Previous page">
                                    <FiChevronLeft />
                                </button>
                                <div className="text-sm text-slate-600 px-2">{pageIndex + 1}/{totalPages}</div>
                                <button onClick={goNext} disabled={pageIndex >= totalPages - 1} className="p-2 rounded bg-white/90 border border-[#efe7ff] hover:shadow-sm" aria-label="Next page">
                                    <FiChevronRightIcon />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Carousel viewport (fixed, no scroll) */}
                    {loadingAssignments ? (
                        <Loading />
                    ) : (
                        <div className="relative mt-3">
                            {/* viewport */}
                            <div className="w-full overflow-hidden">
                                <div className="grid grid-cols-1 gap-3">
                                    {/* Render page grid with rows=2 columns=columnsPerRow */}
                                    <div className={`grid`} style={{ gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`, gridAutoRows: 'min-content', gap: '0.75rem' }}>
                                        {Array.from({ length: rows }).map((_, rIdx) => (
                                            <React.Fragment key={`row-${rIdx}`}>
                                                {pageItems.slice(rIdx * columnsPerRow, (rIdx + 1) * columnsPerRow).map((it) => (
                                                    <div key={String(it._id) + (it.__kind || "")}>
                                                        <ItemCard
                                                            item={it}
                                                            onEdit={it.__kind === 'assignment' ? () => handleEditAssignment(it) : undefined}
                                                            onDelete={it.__kind === 'assignment' ? () => handleDeleteAssignment(it) : () => handleDeleteItem(it)}
                                                            onCopy={() => handleCopyItem(it)}
                                                            onToggle={it.__kind === 'assignment' ? () => handleTogglePublishAssignment(it) : () => handleToggleItemStatus(it)}
                                                            className=""
                                                        />
                                                        {/* For assignments show quick action row */}
                                                        {it.__kind === 'assignment' && (
                                                            <div className="mt-2 flex items-center gap-2 justify-center">
                                                                <button
                                                                    onClick={() => handleTogglePublishAssignment(it)}
                                                                    className={`text-sm px-3 py-1 rounded-md ${it.publish ? "bg-white border border-[#dff5e6] text-[#057a42]" : "bg-white border border-[#fff0d6] text-[#6b4d00]"}`}
                                                                >
                                                                    {it.publish ? "Unpublish" : "Publish"}
                                                                </button>
                                                                <button onClick={() => handleEditAssignment(it)} className="text-sm px-3 py-1 rounded-md bg-white border border-[#efe7ff]">
                                                                    Edit
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* if no items */}
                            {filtered.length === 0 && (
                                <div className="mt-3 text-sm text-slate-500">No items or assignments found.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}
