// LinkCourseInfoForm.jsx
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setLinkCourse, setStep } from "@/entities/classroom/model/classroomSlice";
import Input from "@/shared/components/ui/Input";
import Textarea from "@/shared/components/ui/Textarea";
import Button from "@/shared/components/ui/Button";
import { toast } from "react-hot-toast";

export default function LinkCourseInfoForm({ classroomId, topicId }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { linkCourse = {} } = useSelector((s) => s.classroom || {});
    const { register, handleSubmit, control, reset } = useForm();

    useEffect(() => {
        if (linkCourse) {
            reset({
                title: linkCourse.title ?? "",
                description: linkCourse.description ?? "",
            });
        }
    }, [linkCourse, reset]);

    const onNext = (data) => {
        if (!data.title || data.title.trim() === "") {
            toast.error("Please add a title");
            return;
        }
        dispatch(setLinkCourse({ ...(linkCourse || {}), title: data.title.trim(), description: data.description || "" }));
        dispatch(setStep(2));
    };

    return (
        <form onSubmit={handleSubmit(onNext)} className="space-y-6 rounded-2xl border border-white/8 bg-white/6 p-6 max-w-2xl mx-auto">
            <div className="max-w-lg mt-4">
                <Input label="Title" {...register("title", { required: true })} placeholder="Enter title for linked items" />
            </div>

            <div className="max-w-lg mt-4">
                <Controller
                    name="description"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <Textarea
                            id="description"
                            label="Description / Notes"
                            placeholder="Optional description to include for each created item"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            rows={5}
                        />
                    )}
                />
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="light" onClick={() => navigate(`/classroom/${classroomId}/classwork`)} className="bg-white text-black">
                    Cancel
                </Button>
                <Button type="submit">Next</Button>
            </div>
        </form>
    );
}
