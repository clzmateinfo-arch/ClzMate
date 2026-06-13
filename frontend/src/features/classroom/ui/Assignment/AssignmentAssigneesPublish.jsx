import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setStep, setAssignment } from "@/entities/classroom/model/classroomSlice";
import { updateAssignmentAPI } from "@/entities/classroom/model/classroomAPI";
import Button from "@/shared/components/ui/Button";
import FieldsetRadio from "@/shared/components/ui/FieldsetRadio";
import { toast } from "react-hot-toast";
import { FiSearch } from "react-icons/fi";
import Loading from "@/shared/components/navigation/Loading";

export default function AssignmentAssigneesPublish({ classroomId, overview }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useSelector((s) => s.auth || {});
    const { assignment } = useSelector((s) => s.classroom || {});
    const [assigneeType, setAssigneeType] = useState(assignment?.assigneeType || "all");
    const [selected, setSelected] = useState((assignment?.assignees || []).map(String));
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const members = overview?.classroom?.members || [];
    const [loading] = useState(false);
    const [publishChecked, setPublishChecked] = useState(Boolean(assignment?.publish));

    useEffect(() => {
        setAssigneeType(assignment?.assigneeType || "all");
        setSelected((assignment?.assignees || []).map(String));
        setPublishChecked(Boolean(assignment?.publish));
    }, [assignment]);

    const allMemberIds = useMemo(() => members.map((m) => String(m.user?._id ?? m.user)), [members]);

    const filteredMembers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return members;
        return members.filter((m) => {
            const name = m.user?.firstName || m.user?.preferredName || m.user?.name || m.user?.email?.split?.("@")?.[0] || "";
            const email = m.user?.email || "";
            return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
        });
    }, [searchTerm, members]);

    const toggleStudent = (id) => {
        const sid = String(id);
        setSelected((prev) => (prev.includes(sid) ? prev.filter((p) => p !== sid) : [...prev, sid]));
    };

    const selectAll = () => setSelected(allMemberIds.slice());
    const clearAll = () => setSelected([]);

    const goBack = () => {
        dispatch(setStep(2));
    };

    const saveAssignment = async (publishFlag = false) => {
        if (!assignment || !assignment._id) throw new Error("Assignment missing. Please start from step 1.");
        if (assigneeType === "selected" && (!selected || selected.length === 0)) throw new Error("Please choose at least one assignee.");

        const payload = {
            assigneeType,
            assignees: assigneeType === "selected" ? selected : [],
            publish: publishFlag,
            classesAssigned: assignment?.classesAssigned?.length ? assignment.classesAssigned : classroomId ? [classroomId] : [],
        };

        const res = await updateAssignmentAPI(assignment._id, payload, token, false);
        return res;
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const res = await saveAssignment(false);
            dispatch(setAssignment(res));
            toast.success("Saved draft");
        } catch (err) {
            console.error("Save draft failed", err);
            toast.error(err?.message || "Failed to save draft");
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        setSaving(true);
        try {
            const res = await saveAssignment(Boolean(publishChecked));
            dispatch(setAssignment(res));
            toast.success(publishChecked ? "Assignment published" : "Saved");
            navigate(`/classroom/${classroomId}/classwork`);
        } catch (err) {
            console.error("Save & Next failed", err);
            toast.error(err?.message || "Failed to save assignment");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;

    const radioOptions = [
        { value: "all", label: "Entire class" },
        { value: "selected", label: "Selected students" },
    ];

    return (
        <div className="rounded-2xl border border-[#efe7ff] bg-white p-6 max-w-3xl mx-auto shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-slate-500 mt-1">Choose who should receive this assignment and save when ready</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`hidden sm:flex items-center`}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${publishChecked ? "bg-[#e6fff2] text-[#057a42] border border-[#dff5e6]" : "bg-[#fff7e6] text-[#6b4d00] border border-[#fff0d6]"}`}>
                            {publishChecked ? "Published" : "Draft"}
                        </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm select-none">
                        {/* <input type="checkbox" checked={publishChecked} onChange={(e) => setPublishChecked(Boolean(e.target.checked))} className="h-4 w-4" />
                        <span className="text-sm text-[#0b1220]">Publish</span> */}
                        <input id="public" type="checkbox" checked={publishChecked} onChange={(e) => setPublishChecked(Boolean(e.target.checked))} className="sr-only peer" />
                        <div className="flex items-center justify-center mt-0.5 w-6 h-6 rounded-md border-2 transition-all duration-150
                           border-slate-500 peer-checked:border-transparent peer-checked:bg-gradient-to-tr peer-checked:from-[#ba7bf0] peer-checked:via-[#996bec] peer-checked:to-[#5046e4]
                           peer-focus:ring-2 peer-focus:ring-offset-1 peer-focus:ring-[#ba7bf0]/40" aria-hidden>
                            <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                        </div>
                    </label>
                </div>
            </div>

            <div className="mt-6 space-y-6">
                <FieldsetRadio name="assigneeType" label="Assign to" options={radioOptions} value={assigneeType} onChange={(v) => setAssigneeType(v)} orientation="row" />

                {assigneeType === "selected" && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-sm font-medium text-[#0b1220]">Choose students</p>

                            <div className="flex items-center gap-2">
                                <button type="button" onClick={selectAll} className="text-sm px-3 py-1 rounded-md border border-[#f1f1f16c] hover:bg-[#f7f7f75b]">Select all</button>
                                <button type="button" onClick={clearAll} className="text-sm px-3 py-1 rounded-md border border-[#f1f1f16c] hover:bg-[#f7f7f75b]">Clear</button>
                            </div>
                        </div>

                        <div className="relative">
                            <FiSearch className="absolute left-3 top-3 text-slate-400" />
                            <input type="text" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-[#efe7ff] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#996bec]/30" />
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-auto pr-2 my-4">
                            {filteredMembers.length === 0 && <div className="text-sm text-slate-500">No students found.</div>}

                            {filteredMembers.map((m) => {
                                const uid = String(m.user?._id ?? m.user);
                                const name = m.user?.firstName || m.user?.preferredName || m.user?.name || m.user?.email?.split?.("@")?.[0] || "Student";
                                const email = m.user?.email || "";
                                const image = m.user?.image;

                                return (
                                    <label key={uid} className={`flex items-center gap-3 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer select-none ${selected.includes(uid) ? "border border-[#5c2bc0] bg-[#7028c225]" : "border border-[#efe7ff]"}`}>
                                        <input type="checkbox" checked={selected.includes(uid)} onChange={() => toggleStudent(uid)} className="hidden" />
                                        <img src={image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(name)} alt={name} className="h-10 w-10 rounded-full object-cover border border-[#efe7ff]" />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-[#0b1220] truncate">{name}</div>
                                            <div className="text-xs text-slate-500 truncate">{email}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="light" onClick={goBack} className="bg-white text-black">Back</Button>

                    <Button onClick={handleSaveDraft} variant="light" className="bg-white/95 text-[#0b1220]" disabled={saving}>
                        {saving ? "Saving..." : "Save Draft"}
                    </Button>

                    <Button onClick={handleNext} disabled={saving}>
                        {saving ? "Saving..." : "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
