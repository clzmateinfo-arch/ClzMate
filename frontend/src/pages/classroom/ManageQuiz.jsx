import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import RenderStepsQuiz from "@/features/classroom/ui/Quiz/RenderStepsQuiz";
import Loading from "@/shared/components/navigation/Loading";
import { getQuizAPI, fetchClassOverviewAPI } from "@/entities/classroom/model/quizAPI";
import { setQuiz, setEditQuiz, setStepQuiz } from "@/entities/classroom/model/quizSlice";

export default function ManageQuiz() {
    const dispatch = useDispatch();
    const { token } = useSelector((s) => s.auth || {});
    const { quiz } = useSelector((s) => s.quiz || {});
    const { classroomId, topicId, quizId } = useParams();
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
                console.warn("ManageQuiz: failed to fetch overview", e);
            }

            if (quizId) {
                try {
                    const q = await getQuizAPI(quizId, token);
                    if (q) {
                        const normalized = { ...q, _id: q._id || q.id };
                        dispatch(setQuiz(normalized));
                        dispatch(setEditQuiz(true));
                        dispatch(setStepQuiz(1));
                    } else {
                        throw new Error("empty quiz");
                    }
                } catch (err) {
                    try {
                        const fallbackList = fetchedOverview?.upcomingAssignments || fetchedOverview?.upcomingQuizzes || [];
                        const found = fallbackList.find((x) => String(x._id) === String(quizId) || String(x.id) === String(quizId));
                        if (found) {
                            const normalized = { ...found, _id: found._id || found.id };
                            dispatch(setQuiz(normalized));
                            dispatch(setEditQuiz(true));
                            dispatch(setStepQuiz(1));
                        } else {
                            dispatch(setQuiz(null));
                            dispatch(setEditQuiz(false));
                            dispatch(setStepQuiz(1));
                        }
                    } catch (e2) {
                        dispatch(setQuiz(null));
                        dispatch(setEditQuiz(false));
                        dispatch(setStepQuiz(1));
                    }
                }
            } else {
                dispatch(setQuiz(null));
                dispatch(setEditQuiz(false));
                dispatch(setStepQuiz(1));
            }

            setLoading(false);
        })();
    }, [location.pathname, quizId, classroomId, topicId, token, dispatch]);

    if (loading) return <Loading />;

    return (
        <div className="bg-transparent text-[#0b1220] min-h-screen pb-24">
            <DashboardHeader
                title={quizId ? "Edit Quiz" : "Create Quiz"}
                subtitle={quizId ? "Edit your quiz in a few easy steps" : "Create new quiz in a few easy steps"}
                background={backImg}
                showSearch={false}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 hidden lg:block rounded-2xl border border-white/8 bg-white/6 p-6 shadow-sm">
                            <p className="text-lg font-semibold text-[#0b1220]">Quiz Builder Tips</p>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                <li>Start with clear title and instructions.</li>
                                <li>Add screens (question pages) using the builder and set correct answers.</li>
                                <li>Configure per-screen properties: time, points, single/multiple select.</li>
                                <li>Publish to make quiz available to students.</li>
                            </ul>
                        </div>
                    </div>

                    <aside className="lg:col-span-9">
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-6 shadow-sm">
                            <RenderStepsQuiz classroomId={classroomId} topicId={topicId} quizId={quizId} overview={overview} />
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
