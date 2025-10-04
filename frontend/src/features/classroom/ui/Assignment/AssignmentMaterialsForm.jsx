import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import MultiUpload from "@/shared/components/ui/MultiUpload";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";
import { updateAssignmentAPI } from "@/entities/classroom/model/classroomAPI";
import { setAssignment, setStep } from "@/entities/classroom/model/classroomSlice";
import { toast } from "react-hot-toast";

export default function AssignmentMaterialsForm({ topicId }) {
    const dispatch = useDispatch();
    const classroomState = useSelector((s) => s.classroom || {});
    const { assignment } = classroomState || {};
    const { token } = useSelector((s) => s.auth || {});
    const { register, handleSubmit, setValue, getValues } = useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (assignment) {
            setValue("references", assignment.references ?? "");
            setValue("supportMaterials", { new: [], existing: assignment.attachments ?? [], remove: [] });
        } else {
            setValue("references", "");
            setValue("supportMaterials", { new: [], existing: [], remove: [] });
        }
    }, [assignment, setValue]);

    const onSubmit = async (data) => {
        if (!assignment || !assignment._id) {
            toast.error("Assignment not found. Please complete Step 1 first.");
            return;
        }
        setLoading(true);
        try {
            const form = new FormData();
            form.append("references", data.references ?? "");
            const support = getValues("supportMaterials") || { new: [], existing: [], remove: [] };
            const newFiles = Array.isArray(support.new) ? support.new : [];
            newFiles.forEach((f) => form.append("attachments", f));
            form.append("removeAttachments", JSON.stringify(Array.isArray(support.remove) ? support.remove : []));
            const updated = await updateAssignmentAPI(assignment._id, form, token, true);
            dispatch(setAssignment(updated));
            dispatch(setStep(3));
            toast.success("Materials saved");
        } catch (err) {
            console.error("Failed saving materials", err);
            toast.error(err?.message || "Failed to save materials");
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => dispatch(setStep(1));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-2xl border border-white/8 bg-white/6 p-6 max-w-2xl mx-auto">
            <div>
                <div className="mt-4">
                    <Input label="References (URLs)" {...register("references")} placeholder="Optional references / links" />
                </div>
                <div className="mt-4">
                    <MultiUpload
                        name="supportMaterials"
                        label="Attachments (examples, datasets, PDFs, zips)"
                        register={register}
                        setValue={setValue}
                        errors={{}}
                        allowedTypes="image/*,video/*,application/pdf,.zip"
                        viewData={assignment?.attachments ?? []}
                        editData={assignment?.attachments ?? []}
                        disabled={true}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
                <Button variant="light" onClick={goBack} className="bg-white text-black">Back</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Next"}</Button>
            </div>
        </form>
    );
}
