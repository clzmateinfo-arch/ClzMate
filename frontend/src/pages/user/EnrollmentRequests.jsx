import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loading from "@/shared/components/navigation/Loading";
import Button from "@/shared/components/ui/Button";
import { fetchCourseEnrollmentRequests, respondEnrollmentRequest } from "@/entities/course/model/courseDetailsAPI";
import Img from "@/shared/components/ui/Img";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

export default function EnrollmentRequests() {
    const { courseId } = useParams();
    const { token } = useSelector((s) => s.auth || {});
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!courseId || !token) return;
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchCourseEnrollmentRequests(courseId, token);
                if (!mounted) return;
                if (res?.success) {
                    setRequests(res.data?.enrollmentRequests || res.data || []);
                } else {
                    console.error("Failed fetching requests", res);
                }
            } catch (err) {
                console.error("Failed to fetch requests", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [courseId, token]);

    const handleRespond = async (requestId, action) => {
        if (!token) return;
        setProcessing(requestId);
        try {
            const res = await respondEnrollmentRequest(courseId, requestId, action, "", token);
            if (res?.success) {
                setRequests((prev) => prev.map((r) => (r._id === requestId ? { ...r, status: action === "approve" ? "Approved" : "Rejected", responder: res.data?.responder || "You" } : r)));
            } else {
                alert(res?.message || "Failed to respond");
            }
        } catch (err) {
            console.error("respond error", err);
            alert("Failed to respond to request");
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
            <DashboardHeader
                title="Enrollment Requests"
                subtitle="Approve or reject student enrollment requests for this course"
                background={backImg}
                showSearch={false}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="mx-auto w-11/12 max-w-maxContent mt-2 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
                    {requests.length === 0 ? (
                        <div className="space-y-2 items-start min-h-[220px] shadow-md rounded-lg border border-white/8 bg-white/6 p-6">
                            <div className="text-sm text-black/70">
                                No enrollment requests for this course.
                            </div>
                            <div className="mt-4">
                                <Button onClick={() => navigate(-1)} className="w-xs">Back to Courses</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 shadow-md rounded-lg border border-white/8 bg-white/6 px-4 py-4">
                            {requests.map((r, idx) => (
                                <article key={r._id ?? idx} className="flex flex-col sm:flex-row sm:items-center border-b last:border-b-0 px-2 py-3 transition-all hover:shadow-xs">
                                    <div className="flex items-center gap-4 w-full sm:w-2/5">
                                        <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                            {r.user?.image ? <Img src={r.user.image} alt={r.user.firstName} className="h-full w-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-semibold text-richblack-900 truncate">{`${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim() || "Student"}</p>
                                            <p className="text-xs text-richblack-400 mt-1">{r.user?.email}</p>
                                            <p className="text-xs text-richblack-400 mt-1">Requested: <span className="font-medium text-black">{new Date(r.requestedAt).toLocaleString()}</span></p>
                                            {r.note && <p className="text-xs text-richblack-400 mt-1">Note: {r.note}</p>}
                                        </div>
                                    </div>

                                    <div className="hidden sm:flex items-center justify-center w-1/4 px-2 text-sm text-richblack-600">
                                    </div>

                                    <div className="w-full sm:flex-1 px-2 mt-3 sm:mt-0 flex items-center justify-between gap-3">
                                        <div className="text-xs text-richblack-600">
                                            <div>Status: <span className={`font-semibold ${r.status === "Approved" ? "text-green-600" : r.status === "Rejected" ? "text-red-600" : "text-yellow-600"}`}>{r.status}</span></div>
                                            {r.responder && <div className="text-xs text-richblack-500">Responded by: {r.responder}</div>}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {r.status === "Pending" ? (
                                                <>
                                                    <Button disabled={processing === r._id} onClick={() => handleRespond(r._id, "approve")} className="bg-green-600 text-white text-sm">Approve</Button>
                                                    <Button disabled={processing === r._id} onClick={() => handleRespond(r._id, "reject")} className="bg-red-600 text-white text-sm">Reject</Button>
                                                </>
                                            ) : (
                                                <></>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
