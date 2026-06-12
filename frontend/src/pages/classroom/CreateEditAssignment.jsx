// frontend/src/pages/classroom/CreateEditAssignment.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import Loading from "@/shared/components/navigation/Loading";
import RenderStepsAssignment from "@/features/classroomAssignment/ui/RenderStepsAssignment";
import { getAssignmentAPI, fetchClassOverviewAPI } from "@/entities/classroom/model/classroomAPI";
import { setAssignment, setEditAssignment, setStep } from "@/entities/classroom/model/classroomSlice";

export default function CreateEditAssignment() {
    const { classroomId, topicId, assignmentId } = useParams();
    const { token } = useSelector((s) => s.auth);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            dispatch(setStep(1));
            dispatch(setEditAssignment(false));
            dispatch(setAssignment(null));

            // load classroom overview (members list) in background so steps can use it
            try {
                await fetchClassOverviewAPI(classroomId, token);
            } catch (err) {
                // ignore here; individual components will re-fetch if necessary
            }

            // If editing an existing assignment, fetch it
            if (assignmentId) {
                try {
                    const a = await getAssignmentAPI(assignmentId, token);
                    dispatch(setAssignment(a));
                    dispatch(setEditAssignment(true));
                    dispatch(setStep(1));
                } catch (err) {
                    console.error("Failed to load assignment", err);
                }
            }

            setLoading(false);
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentId, classroomId, topicId]);

    if (loading) return <Loading />;

    return (
        <div className="bg-transparent text-richblack-900 min-h-screen pb-24">
            <DashboardHeader
                title={assignmentId ? "Edit Assignment" : "Create Assignment"}
                subtitle={assignmentId ? "Edit assignment for this topic" : "Create a new assignment in a few steps"}
                background={backImg}
                showSearch={false}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 hidden lg:block rounded-2xl border border-white/8 bg-white/6 p-6 shadow-sm">
                            <p className="text-lg font-semibold text-richblack-900">Tips</p>
                            <ul className="mt-4 space-y-2 text-sm text-richblack-600">
                                <li>Make due date clear and timezone-aware</li>
                                <li>Attach required materials in step 2</li>
                                <li>Step 3 lets you assign to all or selected students</li>
                            </ul>
                        </div>
                    </div>

                    <aside className="lg:col-span-9">
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-6 shadow-sm">
                            <RenderStepsAssignment classroomId={classroomId} topicId={topicId} assignmentId={assignmentId} />
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
