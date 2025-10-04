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
    const classroomState = useSelector((s) => s.classroom || {});
    const { assignment, step } = classroomState || {};
    const { classroomId, topicId, assignmentId } = useParams();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const location = useLocation();

    useEffect(() => {
        (async () => {
            setLoading(true);
            let fetchedOverview = null;
            try {
                if (classroomId) {
                    fetchedOverview = await fetchClassOverviewAPI(classroomId, token);
                    setOverview(fetchedOverview);
                }
            } catch (e) {
                console.warn("Failed to fetch class overview:", e);
            }

            console.log("Params:", { classroomId, topicId, assignmentId });
            if (assignmentId) {
                try {
                    const a = await getAssignmentAPI(assignmentId, token);
                    if (a) {
                        const normalized = { ...a, _id: a._id || a.id };
                        dispatch(setAssignment(normalized));
                        dispatch(setEditAssignment(true));
                        dispatch(setStep(1));
                    } else {
                        throw new Error("Empty assignment returned");
                    }
                } catch (err) {
                    try {
                        const fallbackList = fetchedOverview?.upcomingAssignments || [];
                        const found = fallbackList.find((x) => String(x._id) === String(assignmentId) || String(x.id) === String(assignmentId));
                        if (found) {
                            const normalized = { ...found, _id: found._id || found.id };
                            dispatch(setAssignment(normalized));
                            dispatch(setEditAssignment(true));
                            dispatch(setStep(1));
                        } else {
                            dispatch(setAssignment(null));
                            dispatch(setEditAssignment(false));
                            dispatch(setStep(1));
                        }
                    } catch (e2) {
                        dispatch(setAssignment(null));
                        dispatch(setEditAssignment(false));
                        dispatch(setStep(1));
                    }
                }
            } else {
                dispatch(setAssignment(null));
                dispatch(setEditAssignment(false));
                dispatch(setStep(1));
            }

            setLoading(false);
        })();
    }, [location.pathname, assignmentId, classroomId, topicId, token, dispatch]);

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
