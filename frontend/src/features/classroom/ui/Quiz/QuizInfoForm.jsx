import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { createQuizAPI, updateQuizAPI } from "@/entities/classroom/model/classroomAPI";
import { setQuiz, setStepQuiz, setEditQuiz } from "@/entities/classroom/model/classroomSlice";
import Input from "@/shared/components/ui/Input";
import Textarea from "@/shared/components/ui/Textarea";
import Button from "@/shared/components/ui/Button";
import { toast } from "react-hot-toast";

export default function QuizInfoForm({ topicId }) {
    const dispatch = useDispatch();
    const { token } = useSelector((s) => s.auth || {});
    const { quiz, editQuiz } = useSelector((s) => s.classroom || {});
    const { register, handleSubmit, reset } = useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (quiz) {
            reset({
                title: quiz.title ?? "",
                description: quiz.description ?? "",
                timeLimit: quiz.timeLimit ?? 0,
                shuffle: Boolean(quiz.shuffle),
            });
        } else {
            reset({ title: "", description: "", timeLimit: 0, shuffle: false });
        }
    }, [quiz, reset]);

    const onSubmit = async (data) => {
        if (!data.title || !data.title.trim()) {
            toast.error("Title is required");
            return;
        }
        setLoading(true);
        try {
            const payload = { title: data.title.trim(), description: data.description ?? "", timeLimit: Number(data.timeLimit) || 0, shuffle: Boolean(data.shuffle) };
            if (editQuiz && quiz && quiz._id) {
                const res = await updateQuizAPI(quiz._id, payload, token);
                dispatch(setQuiz(res));
                dispatch(setStepQuiz(2));
                toast.success("Quiz info updated");
            } else {
                if (!topicId) {
                    toast.error("Missing topic context");
                    setLoading(false);
                    return;
                }
                const res = await createQuizAPI(topicId, payload, token);
                dispatch(setQuiz(res));
                dispatch(setEditQuiz(true));
                dispatch(setStepQuiz(2));
                toast.success("Quiz created");
            }
        } catch (err) {
            console.error("QuizInfoForm.save", err);
            toast.error(err?.message || "Failed to save quiz info");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-2xl border border-white/8 bg-white/6 p-6 max-w-2xl mx-auto">
            <div className="max-w-lg mt-4">
                <Input label="Title" {...register("title", { required: true })} placeholder="Enter quiz title" />
            </div>

            <div className="max-w-lg mt-4">
                <Textarea label="Description" {...register("description")} placeholder="Optional description" rows={4} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <Input label="Default time limit (seconds)" type="number" {...register("timeLimit")} placeholder="0 (no limit)" />
                </div>
                <div className="flex items-center gap-3">
                    <input id="shuffle" type="checkbox" {...register("shuffle")} className="h-4 w-4" />
                    <label htmlFor="shuffle" className="text-sm">Shuffle screens</label>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="light" onClick={() => dispatch(setStepQuiz(1))} className="bg-white text-black">Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Next"}</Button>
            </div>
        </form>
    );
}
