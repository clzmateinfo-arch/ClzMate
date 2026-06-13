import { useState, useEffect } from "react";
import { FiClock, FiPaperclip, FiX } from "react-icons/fi";
import ResourceViewer from "@/shared/components/app/ResourceViewer";
import PlayerPanel from "@/shared/components/app/PlayerPanel";
import ExternalVideo from "@/shared/components/app/ExternalVideo";
import { MdOutlinePreview } from "react-icons/md";
import { getMySubmissionAPI, submitAssignmentAPI } from "@/entities/classroom/model/classroomAPI";
import MultiUpload from "@/shared/components/ui/MultiUpload";
import Textarea from "@/shared/components/ui/Textarea";
import IconBtn from "@/shared/components/ui/IconBtn";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";


export default function AssignmentCard({
    assignment = {},
    _onTogglePublish = () => { },
    onSubmit = null,
    token = null,
}) {
    const [submitting, setSubmitting] = useState(false);
    const title = assignment.title || "Assignment";
    const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const dueText = due ? due.toLocaleString() : null;
    const attachments = assignment.attachments || [];
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewResource, setPreviewResource] = useState(null);
    const [submitOpen, setSubmitOpen] = useState(false);
    const [existingSubmission, setExistingSubmission] = useState(null);
    const [loadingSubmission, setLoadingSubmission] = useState(false);
    const [loadingInitialSubmission, setLoadingInitialSubmission] = useState(false);

    const { register, setValue, getValues, formState: { errors }, reset } = useForm();

    const [note, setNote] = useState("");

    useEffect(() => {
        if (previewOpen || submitOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev || "";
            };
        }
    }, [previewOpen, submitOpen]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                if (previewOpen) {
                    setPreviewOpen(false);
                    setPreviewResource(null);
                }
                if (submitOpen) {
                    setSubmitOpen(false);
                }
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [previewOpen, submitOpen]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!token || !assignment?._id) {
                setExistingSubmission(null);
                // return;
            }
            setLoadingInitialSubmission(true);
            try {
                const sub = await getMySubmissionAPI(assignment._id, token);
                if (mounted) {
                    setExistingSubmission(sub || null);
                }
            } catch (err) {
                console.warn("Failed to fetch existing submission", err);
            } finally {
                if (mounted) setLoadingInitialSubmission(false);
            }
        })();
        return () => { mounted = false; };
    }, [assignment?._id, token, assignment.publish]);

    const openPreview = (file) => {
        if (!file) return;
        setPreviewResource(file);
        setPreviewOpen(true);
    };

    const isYoutubeLike = (url) => {
        if (!url || typeof url !== "string") return false;
        const u = url.toLowerCase();
        return u.includes("youtube.com") || u.includes("youtu.be") || u.includes("vimeo.com");
    };

    const mt = (r = {}) => (r.mimeType || "").toLowerCase();
    const name = (r = {}) => (r.originalName || "").toLowerCase();

    const isVideoResource = (r = {}) =>
        (r.resourceType || "").toString().startsWith("video") ||
        (mt(r) && mt(r).startsWith("video")) ||
        /\.(mp4|webm|mov)$/i.test(r.url || r.originalName || "");

    const isPdfResource = (r = {}) =>
        mt(r) === "application/pdf" || (name(r) || "").endsWith(".pdf") || ((r.resourceType || "").startsWith("raw") && (name(r) || "").endsWith(".pdf"));

    const nowIsAfterDue = () => {
        if (!assignment?.dueDate) return false;
        const now = new Date();
        return now > new Date(assignment.dueDate);
    };

    const studentCanSubmit = () => {
        const now = new Date();
        if (assignment.lockSubmissions) return false;
        if (assignment.dueDate && now > new Date(assignment.dueDate)) return false;
        if (existingSubmission?.grade !== null && existingSubmission?.grade !== undefined) return false;
        return true;
    };

    const openSubmitModal = async () => {
        setExistingSubmission(null);
        setLoadingSubmission(true);
        reset();
        setNote("");
        setSubmitOpen(true);

        try {
            if (token && assignment._id) {
                const sub = await getMySubmissionAPI(assignment._id, token);
                if (sub) {
                    setExistingSubmission(sub);
                    setNote(sub.content || "");
                    setValue("submissionFiles", sub.attachments || []);
                } else {
                    setExistingSubmission(null);
                    setValue("submissionFiles", []);
                }
            } else {
                setValue("submissionFiles", []);
            }
        } catch (err) {
            console.warn("Failed to load existing submission", err);
            toast.error("Failed to load your submission");
        } finally {
            setLoadingSubmission(false);
        }
    };

    const handleSubmit = async () => {
        if (!studentCanSubmit()) {
            toast.error("Submissions are closed or locked for this assignment.");
            return;
        }

        const mu = getValues("submissionFiles") || { existing: [], new: [], remove: [] };
        const newFiles = Array.isArray(mu.new) ? mu.new : [];
        const removeAttachments = Array.isArray(mu.remove) ? mu.remove : [];

        if (!token && typeof onSubmit === "function") {
            try {
                setSubmitting(true);
                await onSubmit(assignment, { files: newFiles, content: note, removeAttachments });
                toast.success("Submitted");
                setSubmitOpen(false);
                return;
            } catch (err) {
                console.error("parent onSubmit error", err);
                toast.error("Submission failed");
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (!assignment._id) {
            toast.error("Invalid assignment");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                files: newFiles,
                content: note || "",
                removeAttachments,
            };

            const result = await submitAssignmentAPI(assignment._id, payload, token);
            toast.success("Submission saved");
            setExistingSubmission(result);
            setValue("submissionFiles", result.attachments || []);
            setNote(result.content || "");
            setSubmitOpen(false);
        } catch (err) {
            console.error("submit error", err);
            toast.error(err?.response?.data?.message || err?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    const locked = !!assignment.lockSubmissions;
    const duePassed = nowIsAfterDue();
    const showLockedBanner = locked || duePassed;
    const bannerText = locked ? "Submissions are locked for this assignment." : (duePassed ? "Submission due date has passed." : "");

    const getGradeClasses = (grade, max) => {
        const numericGrade = Number(grade);
        const percent = (max && typeof max === "number" && max > 0)
            ? Math.round((numericGrade / Number(max)) * 100)
            : Math.round(isNaN(numericGrade) ? 0 : numericGrade);

        const p = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));

        if (p >= 85) {
            return "border-green-200 bg-green-50 text-green-900 dark:border-green-800/40 dark:bg-green-800/10 dark:text-green-300";
        } else if (p >= 70) {
            return "border-lime-200 bg-lime-50 text-lime-900 dark:border-lime-800/40 dark:bg-lime-800/10 dark:text-lime-300";
        } else if (p >= 50) {
            return "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-700/40 dark:bg-yellow-700/10 dark:text-yellow-200";
        } else if (p >= 35) {
            return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700/40 dark:bg-amber-700/10 dark:text-amber-200";
        } else {
            return "border-red-200 bg-red-50 text-red-900 dark:border-red-700/40 dark:bg-red-700/10 dark:text-red-200";
        }
    };

    return (
        <>
            <article className="group relative rounded-2xl bg-white dark:bg-slate-800/60 border border-transparent dark:border-slate-700/40 p-4 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 overflow-hidden backdrop-blur-sm" aria-label={title}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                            {String(title || "A").charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h4>
                            <div className={`text-xs px-2 py-1 rounded-md font-medium ${assignment.publish ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300" : "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"}`} >
                                {assignment.publish ? "Published" : "Draft"}
                            </div>
                        </div>

                        {assignment.instructions ? (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">{assignment.instructions}</p>
                        ) : (
                            <p className="text-xs text-slate-400 dark:text-slate-400 mt-2">No instructions provided</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                            {assignment.points ? <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/30">{assignment.points} pts</span> : null}
                            {dueText ? (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/30">
                                    <FiClock className="text-sm" /> Due: <span className="ml-1 font-medium text-slate-700 dark:text-slate-200 text-xs">{dueText}</span>
                                </span>
                            ) : null}
                            <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/30 text-xs">{assignment.assigneeType || "All"}</span>
                        </div>
                    </div>
                </div>

                {showLockedBanner && (
                    <div className="mt-4">
                        <div className="w-full rounded-md border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm font-medium">
                            {bannerText}
                        </div>
                    </div>
                )}

                {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-300 gap-2 font-medium mt-1 mb-3">
                            <FiPaperclip /> Attachments
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {attachments.map((att) => {
                                const key = att._id || att.publicId || att.url || Math.random().toString(36).slice(2);
                                return (
                                    <div key={key} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30">
                                        <div
                                            className="min-w-0 cursor-pointer"
                                            onClick={() => openPreview(att)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") openPreview(att);
                                            }}
                                        >
                                            <div className="text-sm truncate text-slate-800 dark:text-slate-100">{att.originalName || att.url}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-300">{att.mimeType || ""}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer text-slate-600 dark:text-slate-300"
                                                onClick={(_e) => openPreview(att)}
                                            >
                                                <MdOutlinePreview />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {existingSubmission && (existingSubmission.grade !== null && existingSubmission.grade !== undefined) && (
                    <div className="mt-4">
                        <div className={`w-full rounded-md border px-3 py-3 text-sm ${getGradeClasses(existingSubmission.grade, assignment.points)}`}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-xs text-slate-400 font-medium">Grade</div>
                                    <div className="text-lg font-semibold">{existingSubmission.grade} {assignment.points ? ` / ${assignment.points}` : ""}</div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-slate-400 font-medium">Feedback</div>
                                    <div className="text-sm text-slate-500 truncate">{existingSubmission.feedback || "No feedback provided"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            disabled={!studentCanSubmit()}
                            onClick={openSubmitModal}
                            className={`px-3 py-1 rounded-md ${studentCanSubmit() ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" : "bg-slate-200 text-slate-500"} text-sm font-medium shadow-sm hover:shadow-md transition disabled:opacity-60`}
                        >
                            {existingSubmission ? "Resubmit" : "Submit"}
                        </button>
                    </div>

                    <div>
                        {loadingInitialSubmission ? (
                            <div className="text-xs text-slate-400">Checking submission...</div>
                        ) : existingSubmission ? (
                            <div className="text-xs text-slate-600 dark:text-slate-300">Submitted: {new Date(existingSubmission.submittedAt).toLocaleString()}</div>
                        ) : (
                            <div className="text-xs text-slate-400">Not submitted</div>
                        )}
                    </div>
                </div>

                <div className="absolute -inset-0.5 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-400/5 to-purple-500/5 dark:from-indigo-400/6 dark:to-purple-500/6"></div>
                </div>
            </article>

            {previewOpen && previewResource && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Attachment preview">
                    <div className="absolute inset-0 bg-black/70" onClick={() => { setPreviewOpen(false); setPreviewResource(null); }} />
                    <div className="relative w-[92%] md:w-3/4 lg:w-2/3 h-[86%] bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xl z-[1001]">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="text-sm font-medium truncate text-white">{previewResource.originalName || previewResource.url || "Preview"}</div>
                            <button onClick={() => { setPreviewOpen(false); setPreviewResource(null); }} className="p-2 rounded text-white hover:bg-slate-100 dark:hover:bg-slate-800/50" aria-label="Close preview">
                                <FiX />
                            </button>
                        </div>

                        <div className="w-full h-[calc(100%-48px)] bg-black">
                            {isYoutubeLike(previewResource.url || previewResource.link) ? (
                                <ExternalVideo url={previewResource.url || previewResource.link} />
                            ) : isVideoResource(previewResource) || isPdfResource(previewResource) ? (
                                <PlayerPanel
                                    sub={{
                                        title: previewResource.originalName || previewResource.url,
                                        supportMaterials: [previewResource],
                                        timeDuration: previewResource.timeDuration || 0,
                                    }}
                                    course={null}
                                    token={null}
                                    overrideResource={previewResource}
                                />
                            ) : (
                                <ResourceViewer resource={previewResource} course={null} token={null} />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {submitOpen && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Submit assignment">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setSubmitOpen(false)} />

                    <div className="relative w-[94%] md:w-3/4 lg:w-2/3 h-[86%] bg-white rounded-lg overflow-auto shadow-2xl z-[1101]">
                        <div className="flex items-center justify-between px-4 py-3 text-white border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
                            <div className="text-sm font-medium truncate">Submit: {assignment.title}</div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSubmitOpen(false)} className="px-3 py-1 rounded text-black bg-slate-100">Close</button>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="mt-3 mb-1">
                                <Textarea
                                    label="Add note (optional)"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <div className="mt-3 mb-1">
                                <MultiUpload
                                    name="submissionFiles"
                                    label="Attach files (images, video, pdf)"
                                    className="mt-1 text-white"
                                    register={register}
                                    setValue={setValue}
                                    errors={errors}
                                    viewData={existingSubmission ? existingSubmission.attachments || [] : []}
                                    allowedTypes="image/*,video/*,application/pdf,.zip"
                                    disabled={true}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 mt-3 mb-1">
                                <IconBtn textClass="text-black" text="Cancel" onClick={() => setSubmitOpen(false)} outline={true} />
                                <IconBtn
                                    text={submitting ? "Submitting..." : "Submit"}
                                    textClass="text-black"
                                    onClick={handleSubmit}
                                    disabled={submitting || loadingSubmission}
                                    className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white ${submitting || loadingSubmission ? "opacity-60" : ""}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
