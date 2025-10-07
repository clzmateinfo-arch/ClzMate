import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createAssignmentAPI, updateAssignmentAPI } from "@/entities/classroom/model/classroomAPI";
import { setAssignment, setStep, setEditAssignment } from "@/entities/classroom/model/classroomSlice";
import Input from "@/shared/components/ui/Input";
import Textarea from "@/shared/components/ui/Textarea";
import Button from "@/shared/components/ui/Button";
import DateSelector from "../../../../shared/components/ui/DateSelector";
import { toast } from "react-hot-toast";

export default function AssignmentInfoForm({ classroomId, topicId }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useSelector((s) => s.auth || {});
    const { assignment, editAssignment } = useSelector((s) => s.classroom || {});
    const { register, handleSubmit, control, reset, setValue } = useForm();
    const [loading, setLoading] = useState(false);
    const [dueDate, setDueDate] = useState("");

    useEffect(() => {
        if (assignment) {
            reset({
                title: assignment.title ?? "",
                instructions: assignment.instructions ?? assignment.description ?? "",
                dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : "",
                points: assignment.points ?? 100,
            });
            setDueDate(assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : "");
        } else {
            reset({ title: "", instructions: "", dueDate: "", points: 100 });
            setDueDate("");
        }
    }, [assignment, reset, setValue]);

    const handleNext = async (data) => {
        if (!data.title || data.title.trim() === "") {
            toast.error("Please add a title");
            return;
        }
        setLoading(true);
        try {
            const form = new FormData();
            form.append("title", data.title);
            form.append("description", data.instructions ?? "");
            if (dueDate) form.append("dueDate", new Date(dueDate).toISOString());
            form.append("points", data.points ?? 100);

            if (editAssignment && assignment && assignment._id) {
                const res = await updateAssignmentAPI(assignment._id, form, token, true);
                dispatch(setAssignment(res));
                dispatch(setStep(2));
                toast.success("Assignment information updated");
            } else {
                if (!topicId) {
                    toast.error("Missing topic context. Please open Manage Assignment from a topic.");
                    setLoading(false);
                    return;
                }
                const res = await createAssignmentAPI(topicId, form, token, true);
                dispatch(setAssignment(res));
                dispatch(setEditAssignment(true));
                dispatch(setStep(2));
                toast.success("Assignment created (draft)");
            }
        } catch (err) {
            console.error("Save assignment info error", err);
            toast.error(err?.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(handleNext)} className="space-y-6 rounded-2xl border border-white/8 bg-white/6 p-6 max-w-2xl mx-auto">
            <div className="max-w-lg mt-4">
                <Input label="Title" {...register("title", { required: true })} placeholder="Enter assignment title" />
            </div>

            <div className="max-w-lg mt-4">
                <Controller
                    name="instructions"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <Textarea
                            id="instructions"
                            label="Instructions / Description"
                            placeholder="Enter instructions"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            rows={6}
                        />
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <DateSelector
                        label="Due Date"
                        name="dueDate"
                        value={dueDate}
                        onChange={(val) => {
                            setDueDate(val);
                            setValue("dueDate", val);
                        }}
                        required
                        onlyFuture
                        helpText="Date should be in future"
                    />
                </div>

                <div>
                    <Input label="Points" {...register("points", { valueAsNumber: true })} type="number" placeholder="100" />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="light" onClick={() => navigate(`/classroom/${classroomId}/classwork`)} className="bg-white text-black">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Next"}
                </Button>
            </div>
        </form>
    );
}
