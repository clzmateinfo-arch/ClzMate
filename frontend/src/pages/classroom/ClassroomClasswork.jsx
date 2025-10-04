// frontend/src/pages/classroom/Classwork.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import Loading from "@/shared/components/navigation/Loading";
import IconBtn from "@/shared/components/ui/IconBtn";

import TopicCard from "@/features/classroom/ui/TopicCard";
import AssignmentCard from "@/features/classroom/ui/AssignmentCard";

import {
    fetchClassOverviewAPI,
    listTopicsAPI,
    listAssignmentsByTopicAPI,
} from "@/entities/classroom/model/classroomAPI";

import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

export default function ClassroomClasswork() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { token } = useSelector((s) => s.auth || {});

    const [loading, setLoading] = useState(false);
    const [topics, setTopics] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [classroom, setClassroom] = useState(null);

    const load = useCallback(async () => {
        if (!classId) return;
        setLoading(true);

        try {
            // Try overview endpoint to get classroom meta (may not contain topics)
            try {
                const overview = await fetchClassOverviewAPI(classId, token);
                if (overview) {
                    setClassroom(overview.classroom || overview.classroomDetails || overview);
                }
            } catch (e) {
                // ignore; we'll fetch classroom separately if needed
                console.warn("fetchClassOverviewAPI failed for classwork: ", e);
            }

            // Topics
            let topicsList = [];
            try {
                topicsList = await listTopicsAPI(classId, token);
                topicsList = Array.isArray(topicsList) ? topicsList : (topicsList?.data || []);
            } catch (errTopic) {
                console.warn("listTopicsAPI failed", errTopic);
                topicsList = [];
            }
            setTopics(topicsList);

            // For assignments: fetch assignments for each topic in parallel and flatten
            try {
                const assignmentsPerTopic = await Promise.all(
                    (topicsList || []).map(async (t) => {
                        try {
                            const lst = await listAssignmentsByTopicAPI(t._id || t.id, token);
                            return Array.isArray(lst) ? lst : (lst?.data || []);
                        } catch (e) {
                            console.warn("Failed loading assignments for topic", t._id, e);
                            return [];
                        }
                    })
                );
                const flattened = assignmentsPerTopic.flat();
                setAssignments(flattened);
            } catch (errAssign) {
                console.warn("Aggregating assignments failed", errAssign);
                setAssignments([]);
            }
        } catch (err) {
            console.error("Classwork load error", err);
            toast.error(err?.message || "Failed to load classwork");
        } finally {
            setLoading(false);
        }
    }, [classId, token]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent text-richblack-900">
                <Loading />
            </div>
        );
    }

    const handleOpenTopic = (topic) => {
        navigate(`/classroom/${classId}/topic/${topic._id}`);
    };

    const handleCreateAssignment = (topic) => {
        navigate(`/classroom/${classId}/topic/${topic._id}/create-assignment`);
    };

    const handleAttachSubsection = (topic) => {
        navigate(`/classroom/${classId}/topic/${topic._id}/attach-subsection`);
    };

    const handleSubmitAssignment = (assignment) => {
        navigate(`/classroom/${classId}/assignment/${assignment._id}/submit`);
    };

    const handleViewSubmissions = (assignment) => {
        navigate(`/classroom/${classId}/assignment/${assignment._id}/submissions`);
    };

    return (
        <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
            <DashboardHeader
                title={`${classroom?.title || "Classroom"}   Classwork`}
                subtitle="Topics, assignments and materials"
                background={backImg}
                showSearch={false}
            />

            <main className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[85%] lg:max-w-[90%] md:max-w-[95%] sm:max-w-[100%]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-richblack-900">Classwork</h2>
                        <p className="text-sm text-slate-600">Manage topics, attach course subsections, create assignments and quizzes.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <IconBtn onClick={() => navigate(`/classroom/${classId}/topics/new`)} className="bg-white/6">New Topic</IconBtn>
                        <IconBtn onClick={() => navigate(`/classroom/${classId}/assignments/new`)} customClasses="bg-violet-600 text-white">New Assignment</IconBtn>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Topics column */}
                    <div className="col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold text-richblack-900">Topics</h3>
                        {topics.length === 0 ? (
                            <div className="rounded-2xl border border-white/8 bg-white p-4 text-sm text-slate-500">No topics yet</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {topics.map((t) => (
                                    <TopicCard
                                        key={t._id || t.id}
                                        topic={t}
                                        onOpen={handleOpenTopic}
                                        onCreateAssignment={handleCreateAssignment}
                                        onAttachSubsection={handleAttachSubsection}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Assignments column */}
                    <aside className="col-span-1 space-y-4">
                        <h3 className="text-lg font-semibold text-richblack-900">Assignments</h3>

                        {assignments.length === 0 ? (
                            <div className="rounded-2xl border border-white/8 bg-white p-4 text-sm text-slate-500">No assignments</div>
                        ) : (
                            <div className="space-y-3">
                                {assignments.map((a) => (
                                    <AssignmentCard
                                        key={a._id || a.id}
                                        assignment={a}
                                        isInstructor={classroom?.owner?._id === (a?.createdBy || classroom?.owner?._id) || false}
                                        isStudent={true}
                                        onSubmit={handleSubmitAssignment}
                                        onViewSubmissions={handleViewSubmissions}
                                    />
                                ))}
                            </div>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
}
