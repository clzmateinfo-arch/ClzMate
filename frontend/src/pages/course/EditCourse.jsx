import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getFullDetailsOfCourse } from "@/entities/course/model/courseDetailsAPI";
import { setCourse, setEditCourse } from "@/entities/course/model/courseSlice";
import RenderSteps from "@/features/courceManager/ui/RenderSteps";
import Loading from "@/shared/components/navigation/Loading";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import CourseTipsDialog from "@/features/courceManager/ui/CourseTipsDialog";
import { FiZap } from "react-icons/fi";

export default function EditCourse() {
  const dispatch = useDispatch();
  const { courseId } = useParams();
  const { token } = useSelector((state) => state.auth);
  const { course } = useSelector((state) => state.course);
  const [loading, setLoading] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  useEffect(() => {
    const fetchFullCourseDetails = async () => {
      setLoading(true);
      const result = await getFullDetailsOfCourse(courseId, token);
      if (result?.courseDetails) {
        dispatch(setEditCourse(true));
        dispatch(setCourse(result?.courseDetails));
      }
      setLoading(false);
    };

    fetchFullCourseDetails();
  }, [courseId, token]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="bg-transparent text-richblack-900 min-h-screen pb-24">
      <DashboardHeader
        title="Edit Course"
        subtitle="Edit your course in a few easy steps"
        background={backImg}
        showSearch={false}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-3">
            <div className="sticky top-24 hidden lg:block rounded-2xl border border-white/8 bg-white/6 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-lg font-semibold text-richblack-900">Tips</p>
                  </div>
                </div>

                <button
                  onClick={() => setTipsOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7a05cf] via-[#6a00b7] to-[#7a05cf] px-3 py-2 text-sm font-semibold text-white shadow"
                >
                  <span className="mx-1">!</span>
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-richblack-600">
                <li>Thumbnail: 1024×576 (16:9)</li>
                <li>Add a short overview video</li>
                <li>Organize content with sections & lectures</li>
                <li>Use announcements to notify students</li>
              </ul>
            </div>
          </div>

          <aside className="lg:col-span-9">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-6 shadow-sm">
              <RenderSteps />
            </div>

          </aside>
        </div>
      </main>

      <button
        onClick={() => setTipsOpen(true)}
        aria-label="Open course tips"
        className="fixed left-6 bottom-6 z-[1200] flex items-center gap-3 rounded-full px-4 py-3 bg-gradient-to-r from-[#7a05cf] via-[#6a00b7] to-[#7a05cf] text-white shadow-lg hover:scale-105 transition-transform"
      >
        <span className="grid place-items-center w-6 h-6 rounded-full bg-white/8">
          <FiZap className="w-4 h-4" />
        </span>
        <span className="hidden sm:inline-block text-sm font-medium">Tips</span>
      </button>
      <CourseTipsDialog open={tipsOpen} onClose={() => setTipsOpen(false)} />
    </div>
  );
}
