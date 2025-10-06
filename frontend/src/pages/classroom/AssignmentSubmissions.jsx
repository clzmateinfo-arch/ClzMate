import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import Loading from "@/shared/components/navigation/Loading";
import ResourceViewer from "@/shared/components/app/ResourceViewer";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import IconBtn from "@/shared/components/ui/IconBtn";
import { FiLock, FiUnlock, FiSearch, FiEye, FiExternalLink } from "react-icons/fi";

import {
    getAssignmentAPI,
    // Note: ensure these functions exist in your classroomAPI
    getSubmissionsByAssignmentAPI,
    updateSubmissionAPI,
    updateAssignmentAPI,
} from "@/entities/classroom/model/classroomAPI";

export default function AssignmentSubmissions() {
    const { classroomId, assignmentId } = useParams();
    const { token } = useSelector((s) => s.auth || {});
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [query, setQuery] = useState("");
    const [activeTab, setActiveTab] = useState("notGraded");

    const [viewerResource, setViewerResource] = useState(null);
    const [viewerOpen, setViewerOpen] = useState(false);

    const [savingMap, setSavingMap] = useState({});

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!assignmentId) return;
            setLoading(true);
            try {
                const [a, subs] = await Promise.all([
                    getAssignmentAPI(assignmentId, token),
                    typeof getSubmissionsByAssignmentAPI === "function"
                        ? getSubmissionsByAssignmentAPI(assignmentId, token)
                        : Promise.resolve([]),
                ]);
                if (!mounted) return;
                setAssignment(a || null);
                setSubmissions(Array.isArray(subs) ? subs : []);
            } catch (err) {
                console.error("load submissions", err);
                toast.error(err?.message || "Failed to load submissions");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [assignmentId, token]);

    const grouped = useMemo(() => {
        const graded = [];
        const notGraded = [];
        (submissions || []).forEach((s) => {
            if (s.grade !== null && s.grade !== undefined) graded.push(s);
            else notGraded.push(s);
        });
        graded.sort((a, b) => new Date(b.gradedAt || b.submittedAt || 0) - new Date(a.gradedAt || a.submittedAt || 0));
        notGraded.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
        return { graded, notGraded };
    }, [submissions]);

    // search + tab filter
    const filtered = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        const list = activeTab === "graded" ? grouped.graded : grouped.notGraded;
        if (!q) return list;
        return list.filter((s) => {
            const name = `${s.student?.firstName || ""} ${s.student?.lastName || ""}`.toLowerCase();
            const email = (s.student?.email || "").toLowerCase();
            const content = (s.content || "").toLowerCase();
            return name.includes(q) || email.includes(q) || content.includes(q);
        });
    }, [grouped, activeTab, query]);

    const openFileViewer = (file) => {
        setViewerResource(file);
        setViewerOpen(true);
    };

    const handleToggleLock = async () => {
        if (!assignment) return;
        try {
            const updated = await updateAssignmentAPI(assignment._id, { lockSubmissions: !assignment.lockSubmissions }, token, false);
            setAssignment(updated);
            toast.success("Submission lock updated");
        } catch (err) {
            console.error("toggle lock", err);
            toast.error("Failed to update lock");
        }
    };

    const handleSaveGrade = async (subId, grade, feedback) => {
        try {
            setSavingMap((m) => ({ ...m, [subId]: true }));
            if (typeof updateSubmissionAPI !== "function") throw new Error("updateSubmissionAPI not available");
            const updated = await updateSubmissionAPI(assignmentId, subId, { grade, feedback }, token);
            setSubmissions((prev) => prev.map((s) => (String(s._id) === String(updated._id) ? updated : s)));
            toast.success("Grade saved");
        } catch (err) {
            console.error("save grade", err);
            toast.error(err?.message || "Failed to save grade");
        } finally {
            setSavingMap((m) => ({ ...m, [subId]: false }));
        }
    };

    if (loading) return <div className="p-6"><Loading /></div>;

    return (
        <div className="bg-transparent text-[#0b1220] min-h-screen pb-12">
            <DashboardHeader
                title={assignment?.title || "Assignment Submissions"}
                subtitle={assignment?.instructions || ""}
                background={backImg}
                showSearch={false}
                onBack={() => navigate(-1)}
            />

            <div className="mx-auto w-11/12 max-w-[1400px] mt-8">
                <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-100 overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className="text-lg md:text-xl font-semibold truncate">{assignment?.title}</h3>
                            <div className="text-sm text-slate-500 mt-1 truncate">{(submissions || []).length} submission(s) • {assignment?.points ?? "—"} pts</div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">Submissions</div>
                            <div className="flex items-center gap-2">
                                <div className="text-xs text-slate-500 mr-2">Lock submissions</div>
                                <IconBtn
                                    onClick={handleToggleLock}
                                    outline
                                    customClasses={`transition-all duration-150 ${assignment?.lockSubmissions ? "bg-red-600 text-white" : "bg-indigo-600 text-white"}`}
                                    aria-label={assignment?.lockSubmissions ? "Unlock submissions" : "Lock submissions"}
                                >
                                    {assignment?.lockSubmissions ? <FiLock /> : <FiUnlock />}
                                </IconBtn>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                            <button
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === "notGraded" ? "bg-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
                                onClick={() => setActiveTab("notGraded")}
                                aria-pressed={activeTab === "notGraded"}
                            >
                                Not graded <span className="text-xs text-slate-400 ml-2">({grouped.notGraded.length})</span>
                            </button>

                            <button
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === "graded" ? "bg-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
                                onClick={() => setActiveTab("graded")}
                                aria-pressed={activeTab === "graded"}
                            >
                                Graded <span className="text-xs text-slate-400 ml-2">({grouped.graded.length})</span>
                            </button>
                        </div>

                        <div className="w-full md:w-1/3">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search student name, email or content"
                                icon={<FiSearch />}
                                aria-label="Search submissions"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        {filtered.length === 0 ? (
                            <div className="text-sm text-slate-500 p-8 text-center rounded-lg border border-dashed">No pending submissions</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtered.map((s) => (
                                    <SubmissionCard
                                        key={s._id}
                                        submission={s}
                                        onViewFile={openFileViewer}
                                        onSaveGrade={handleSaveGrade}
                                        saving={!!savingMap[s._id]}
                                        assignmentPoints={assignment?.points}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {viewerOpen && viewerResource && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-[1100px] h-[85vh] bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-3 border-b">
                            <div className="text-sm font-semibold truncate max-w-[60%]">{viewerResource.originalName || "Preview"}</div>
                            <div className="flex items-center gap-2">
                                <a href={viewerResource.url} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 rounded hover:bg-slate-100 flex items-center gap-2">Open in new tab <FiExternalLink /></a>
                                <Button onClick={() => setViewerOpen(false)} variant="light">Close</Button>
                            </div>
                        </div>
                        <div className="h-full overflow-auto">
                            <ResourceViewer resource={viewerResource} token={token} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SubmissionCard({ submission, onViewFile, onSaveGrade, saving = false, assignmentPoints = null }) {
    const [open, setOpen] = useState(false);
    const name = `${submission.student?.firstName || ""} ${submission.student?.lastName || ""}`.trim();

    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex flex-col justify-between h-full min-h-[220px] overflow-hidden">
            <div>
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-sm font-semibold text-slate-700 flex-shrink-0">
                        {submission.student?.image ? (
                            <img src={submission.student.image} alt={submission.student?.firstName} className="w-full h-full object-cover" />
                        ) : (
                            (submission.student?.firstName || "S").charAt(0).toUpperCase()
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{name || submission.student?.email || "Student"}</div>
                        <div className="text-xs text-slate-400 truncate">{submission.student?.email}</div>
                        <div className="text-xs text-slate-400 mt-2">Submitted: <span className="whitespace-nowrap">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "—"}</span></div>
                    </div>

                    <div className="text-right flex-shrink-0">
                        {submission.grade !== null && submission.grade !== undefined ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-green-50 text-green-700 font-semibold">{submission.grade}{assignmentPoints ? ` / ${assignmentPoints}` : ""}</div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-50 text-amber-700 font-semibold">Not graded</div>
                        )}
                    </div>
                </div>

                {submission.content && (
                    <div className="mt-3 text-sm text-slate-700 line-clamp-3 break-words">{submission.content}</div>
                )}

                <div className="mt-3 space-y-2 max-h-36 overflow-auto">
                    {(!submission.attachments || submission.attachments.length === 0) && <div className="text-xs text-slate-400">No attachments</div>}
                    {(submission.attachments || []).map((f) => (
                        <div key={f.url || f.originalName} className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50">
                            <div className="min-w-0 mr-3">
                                <div className="text-sm truncate" title={f.originalName || f.url}>{f.originalName || f.url}</div>
                                <div className="text-xs text-slate-400">{f.mimeType}</div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => onViewFile(f)} className="text-xs px-2 py-1 rounded hover:bg-black/5 flex items-center gap-2"><FiEye /> View</button>
                                <a href={f.url} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded hover:bg-black/5">Open</a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4">
                <GradeForm compact submission={submission} onSave={onSaveGrade} saving={saving} />
            </div>
        </div>
    );
}

function GradeForm({ submission, onSave = () => { }, saving = false, compact = false }) {
    const [grade, setGrade] = useState(submission?.grade ?? "");
    const [feedback, setFeedback] = useState(submission?.feedback ?? "");

    useEffect(() => {
        setGrade(submission?.grade ?? "");
        setFeedback(submission?.feedback ?? "");
    }, [submission?._id]);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSave(String(submission._id), grade === "" ? null : Number(grade), feedback);
            }}
            className="w-full"
        >
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                    type="number"
                    min="0"
                    placeholder="Score"
                    value={grade === null || grade === undefined ? "" : grade}
                    onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : "")}
                    className="w-full sm:w-24 px-3 py-2 border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    aria-label="Score"
                />

                <input
                    type="text"
                    placeholder="Feedback (optional)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full flex-1 px-3 py-2 border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    aria-label="Feedback"
                />
            </div>

            <div className="mt-2 flex items-center justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-2 rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-60"
                >
                    {saving ? "Saving..." : submission.grade !== null && submission.grade !== undefined ? "Update" : "Mark"}
                </button>
            </div>
        </form>
    );
}
