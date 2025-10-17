import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setStepQuiz, setQuiz } from "@/entities/classroom/model/classroomSlice";
import { updateQuizAPI } from "@/entities/classroom/model/classroomAPI";
import Button from "@/shared/components/ui/Button";
import { toast } from "react-hot-toast";

export default function QuizPublish({ classroomId, overview }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useSelector((s) => s.auth || {});
    const { quiz } = useSelector((s) => s.classroom || {});
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
    }, [quiz]);

    const publish = async (flag) => {
        if (!quiz || !quiz._id) {
            toast.error("Quiz missing");
            return;
        }
        setPublishing(true);
        try {
            const payload = { publish: !!flag };
            const updated = await updateQuizAPI(quiz._id, payload, token);
            dispatch(setQuiz(updated));
            toast.success(flag ? "Published" : "Saved");
            navigate(`/classroom/${overview?.classroom?._id}/classwork`);
        } catch (err) {
            console.error("publish", err);
            toast.error("Publish failed");
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="rounded-2xl border-white/8 bg-white/6 p-6 max-w-3xl mx-auto shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-2xl font-semibold text-[#0b1220]">Publish Quiz</p>
                    <p className="text-sm text-slate-500 mt-1">Review quiz screens, set publish status and make it available to students.</p>
                </div>

                <div className="hidden sm:flex items-center gap-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${quiz?.publish ? "bg-[#e6fff2] text-[#057a42] border border-[#dff5e6]" : "bg-[#fff7e6] text-[#6b4d00] border border-[#fff0d6]"}`}>
                        {quiz?.publish ? "Published" : "Draft"}
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                <div className="rounded-md border-white/8 p-4 bg-white/20">
                    <div className="text-sm font-medium">Summary</div>
                    <div className="mt-2 text-sm text-slate-600">
                        <div>Title: <strong>{quiz?.title}</strong></div>
                        <div>Screens: <strong>{(quiz?.screens || []).length}</strong></div>
                        <div>Default time limit: <strong>{quiz?.timeLimit ?? 0} sec</strong></div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="light" onClick={() => dispatch(setStepQuiz(2))} className="bg-white text-black">Back</Button>
                    <Button onClick={() => publish(false)} variant="light" className="bg-white/95 text-[#0b1220]" disabled={publishing}>{publishing ? "Saving..." : "Save Draft"}</Button>
                    <Button onClick={() => publish(true)} disabled={publishing}>{publishing ? "Publishing..." : "Publish"}</Button>
                </div>
            </div>
        </div>
    );
}
