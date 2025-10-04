import React from "react";
import { useSelector } from "react-redux";
import StepCard from "@/shared/components/navigation/StepCard";
import AssignmentInfoForm from "./AssignmentInfoForm";
import AssignmentMaterialsForm from "./AssignmentMaterialsForm";
import AssignmentAssigneesPublish from "./AssignmentAssigneesPublish";

export default function RenderStepsAssignment({ classroomId, topicId, assignmentId, overview }) {
    const classroomState = useSelector((s) => s.classroom || {});
    const { step = 1 } = classroomState;

    const steps = [
        { id: 1, title: "Assignment Information", short: "Basics", desc: "Add title, instructions, due date, points." },
        { id: 2, title: "Materials & References", short: "Files", desc: "Attach files, resources and reference links." },
        { id: 3, title: "Assignees & Publish", short: "Assign", desc: "Choose students or entire class and publish." },
    ];

    return (
        <>
            <div className="mb-6">
                <div className="md:hidden">
                    {steps.map((s) => {
                        if (s.id !== step) return null;
                        const state = step > s.id ? "done" : step === s.id ? "active" : "future";
                        return <StepCard key={s.id} id={s.id} title={s.title} short={s.short} desc={s.desc} state={state} compact />;
                    })}
                </div>

                <div className="hidden md:grid md:grid-cols-3 gap-3">
                    {steps.map((s) => {
                        const state = step > s.id ? "done" : step === s.id ? "active" : "future";
                        return (
                            <div key={s.id} className="relative">
                                <StepCard id={s.id} title={s.title} short={s.short} desc={s.desc} state={state} />
                                {s.id !== steps.length && (
                                    <div className="absolute top-1/2 right-[-1.5rem] w-[48px] h-px">
                                        <div className={`h-px w-full ${step > s.id ? "bg-yellow-50" : step === s.id ? "bg-violet-500" : "bg-white/12"}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-violet-950">{steps.find((st) => st.id === step)?.title ?? "Assignment Step"}</h2>
                </div>
            </div>

            <div className="rounded-2xl">
                {step === 1 && <AssignmentInfoForm topicId={topicId} />}
                {step === 2 && <AssignmentMaterialsForm topicId={topicId} />}
                {step === 3 && <AssignmentAssigneesPublish classroomId={classroomId} overview={overview} />}
            </div>
        </>
    );
}
