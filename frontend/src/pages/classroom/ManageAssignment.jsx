// frontend/src/pages/classroom/ManageAssignment.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import RenderStepsAssignment from "@/features/classroom/ui/Assignment/RenderStepsAssignment";
import Loading from "@/shared/components/navigation/Loading";
import { getAssignmentAPI, fetchClassOverviewAPI } from "@/entities/classroom/model/classroomAPI";
import { setAssignment, setEditAssignment, setStep } from "@/entities/classroom/model/classroomSlice";

export default function ManageAssignment() {
    const dispatch = useDispatch();
    const { token } = useSelector((s) => s.auth || {});
    // Defensive selector: if state.classroom is undefined, fallback to {}
    const classroomState = useSelector((s) => s.classroom || {});
    const { assignment, step } = classroomState || {}; // safe destructure

    const { classroomId, topicId, assignmentId } = useParams();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // Helpful debug if classroom slice isn't registered
        if (!("step" in classroomState) && !("assignment" in classroomState)) {
            // Only warn in dev
            // eslint-disable-next-line no-console
            console.warn("ManageAssignment: classroom slice appears missing from store (state.classroom is undefined). Check store registration.");
        }

        (async () => {
            setLoading(true);
            try {
                if (classroomId) {
                    const ov = await fetchClassOverviewAPI(classroomId, token);
                    setOverview(ov);
                }
            } catch (e) {
                console.warn("Failed to fetch class overview:", e);
            }

            if (assignmentId) {
                try {
                    const a = await getAssignmentAPI(assignmentId, token);
                    if (a) {
                        dispatch(setAssignment(a));
                        dispatch(setEditAssignment(true));
                        dispatch(setStep(1));
                    }
                } catch (err) {
                    console.error("Load assignment failed", err);
                }
            } else {
                dispatch(setAssignment(null));
                dispatch(setEditAssignment(false));
                dispatch(setStep(1));
            }

            setLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, assignmentId, classroomId, topicId]);

    if (loading) return <Loading />;

    return (
        <div className="bg-transparent text-richblack-900 min-h-screen pb-24">
            <DashboardHeader
                title={assignmentId ? "Edit Assignment" : "Create Assignment"}
                subtitle={assignmentId ? "Edit your assignment in a few easy steps" : "Create new assignment in a few easy steps"}
                background={backImg}
                showSearch={false}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 hidden lg:block rounded-2xl border border-white/8 bg-white/6 p-6 shadow-sm">
                            <p className="text-lg font-semibold text-richblack-900">Assignment Tips</p>
                            <ul className="mt-4 space-y-2 text-sm text-richblack-600">
                                <li>Use a clear title and detailed instructions.</li>
                                <li>Attach example files or references in step 2.</li>
                                <li>Choose assignees carefully — you can assign to the whole class or selected students.</li>
                                <li>Publishing will make it available to selected students immediately.</li>
                            </ul>
                        </div>
                    </div>

                    <aside className="lg:col-span-9">
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-6 shadow-sm">
                            <RenderStepsAssignment
                                classroomId={classroomId}
                                topicId={topicId}
                                assignmentId={assignmentId}
                                overview={overview}
                            />
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
