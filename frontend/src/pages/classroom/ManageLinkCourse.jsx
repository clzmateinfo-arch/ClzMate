// ManageLinkCourse.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import RenderStepsLinkCourse from "@/features/classroom/ui/LinkCourse/RenderStepsLinkCourse";
import Loading from "@/shared/components/navigation/Loading";
import { fetchClassOverviewAPI } from "@/entities/classroom/model/classroomAPI";
import { setLinkCourse, setEditLinkCourse, setStep } from "@/entities/classroom/model/classroomSlice";

export default function ManageLinkCourse() {
    const dispatch = useDispatch();
    const { token } = useSelector((s) => s.auth || {});
    const classroomState = useSelector((s) => s.classroom || {});
    const { linkCourse, step } = classroomState || {};
    const { classroomId, topicId, linkId } = useParams();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                if (classroomId) {
                    const fetchedOverview = await fetchClassOverviewAPI(classroomId, token);
                    setOverview(fetchedOverview);
                }
            } catch (e) {
                console.warn("Failed to fetch class overview:", e);
            }

            // If editing a pre-existing link item (linkId) you could fetch and prefill here.
            // For now we just reset linkCourse state and start step 1.
            dispatch(setLinkCourse(null));
            dispatch(setEditLinkCourse(Boolean(linkId)));
            dispatch(setStep(1));

            setLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, classroomId, linkId, token, dispatch]);

    if (loading) return <Loading />;

    return (
        <div className="bg-transparent text-richblack-900 min-h-screen pb-24">
            <DashboardHeader
                title={linkId ? "Edit Link Course" : "Link Course Subsections"}
                subtitle={linkId ? "Edit the linked course selection" : "Link course subsections in a few easy steps"}
                background={backImg}
                showSearch={false}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 hidden lg:block rounded-2xl border border-white/8 bg-white/6 p-6 shadow-sm">
                            <p className="text-lg font-semibold text-richblack-900">Link Course Tips</p>
                            <ul className="mt-4 space-y-2 text-sm text-richblack-600">
                                <li>Give descriptive titles so learners know what each linked lecture is.</li>
                                <li>Search your courses using the course picker in step 2.</li>
                                <li>Choose subsections to create one classroom item per selected subsection.</li>
                                <li>Review and create — items are added to the selected topic.</li>
                            </ul>
                        </div>
                    </div>

                    <aside className="lg:col-span-9">
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-6 shadow-sm">
                            <RenderStepsLinkCourse classroomId={classroomId} topicId={topicId} overview={overview} />
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
