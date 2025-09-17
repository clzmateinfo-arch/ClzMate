// src/pages/course/FullscreenCourseView.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CourseSidebarLeft from "@/features/course/ui/CourseSidebarLeft";
import CoursePlayerPanel from "@/features/course/ui/CoursePlayerPanel";
import { getFullDetailsOfCourse } from "@/entities/course/model/courseDetailsAPI";
import {
  setCourseSectionData,
  setEntireCourseData,
  setCompletedLectures,
  setTotalNoOfLectures,
} from "@/entities/course/model/courseSlice";

/**
 * FullscreenCourseView
 * - Fetches course details and populates redux (re-uses your existing api helper)
 * - Renders a full-screen layout with left sidebar and main content.
 */
export default function FullscreenCourseView() {
  const { courseId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth || {});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const courseData = await getFullDetailsOfCourse(courseId, token);
        // your existing API returns { data: { courseDetails, ... }, ... } - adapt if different
        const cd = courseData?.courseDetails ?? courseData?.data?.courseDetails ?? courseData;
        if (cd) {
          dispatch(setCourseSectionData(cd.courseContent || []));
          dispatch(setEntireCourseData(cd));
          dispatch(setCompletedLectures(courseData.completedVideos || []));
          let lectures = 0;
          (cd.courseContent || []).forEach((s) => (lectures += s.subSection?.length || 0));
          dispatch(setTotalNoOfLectures(lectures));
        }
      } catch (err) {
        console.error("Failed to fetch full course details", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, location.pathname]);

  // grid layout: left sidebar (navigation + layout toggles) + main content (Outlet -> VideoDetails)
  return (
    <div className="fixed inset-0 flex bg-neutral-100 text-neutral-900">
      <CourseSidebarLeft />
      <main className="flex-1 overflow-auto">
        <div className="h-full min-h-screen p-4 md:p-6">
          {/* Outlet renders VideoDetails route (we'll reuse CoursePlayerPanel via VideoDetails route or render it here based on route) */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
