import { useEffect, useState } from "react";
import { set, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { editCourseDetails } from "@/entities/course/model/courseDetailsAPI";
import { resetCourseState, setStep } from "@/entities/course/model/courseSlice";
import { COURSE_STATUS } from "@/utils/constants";
import Button from "../../../../shared/components/ui/Button";

export default function PublishCourse() {
  const { register, handleSubmit, setValue, getValues, watch } = useForm({
    defaultValues: {
      public: false,
      requiresApproval: false,
      sandboxEnabled: false,
      sandboxLanguage: "javascript",
      notesEnabled: true,
    },
  });

  const sandboxEnabled = watch("sandboxEnabled");
  const notesEnabled = watch("notesEnabled");
  const requiresApproval = watch("requiresApproval");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useSelector((state) => state.auth || {});
  const { course } = useSelector((state) => state.course || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!course) return;
    const published = course?.status === COURSE_STATUS.PUBLISHED;
    setValue("public", published);

    if (course.features) {
      setValue("sandboxEnabled", !!course.features.sandboxEnabled);
      setValue("sandboxLanguage", course.features.sandboxLanguage || "javascript");
      setValue("notesEnabled", typeof course.features.notesEnabled === "boolean" ? course.features.notesEnabled : true);
    }

    setValue("requiresApproval", typeof course.requiresApproval === "boolean" ? course.requiresApproval : true);

  }, [course, location.pathname]);

  const goBack = () => dispatch(setStep(2));
  const goToCourses = () => {
    dispatch(resetCourseState());
    navigate("/dashboard/my-courses");
  };

  const handleCoursePublish = async () => {
    const publicFlag = Boolean(getValues("public"));

    const features = {
      sandboxEnabled: Boolean(getValues("sandboxEnabled")),
      sandboxLanguage: getValues("sandboxLanguage") || "javascript",
      notesEnabled: Boolean(getValues("notesEnabled")),
    };

    const formData = new FormData();
    formData.append("courseId", course._id);
    formData.append("status", publicFlag ? COURSE_STATUS.PUBLISHED : COURSE_STATUS.DRAFT);
    formData.append("requiresApproval", getValues("requiresApproval") ? "true" : "false");
    formData.append("features", JSON.stringify(features));

    try {
      setLoading(true);
      const result = await editCourseDetails(formData, token);
      if (result) {
        goToCourses();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Publish failed", err);
      setLoading(false);
    }
  };

  const onSubmit = () => handleCoursePublish();

  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-white/3 to-white/2 p-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-black">Publish Settings</p>
          <p className="text-sm text-slate-400 mt-1">
            Choose whether your course is public (visible to students) or stays in draft. Also enable optional features below.
          </p>
        </div>
        <div className="hidden sm:flex items-center">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${course?.status === COURSE_STATUS.PUBLISHED
              ? "bg-[#eae6ff] text-[#5330d6] border border-[#e0d8ff]"
              : "bg-slate-800/40 text-slate-200 border border-slate-700"
              }`}
          >
            {course?.status === COURSE_STATUS.PUBLISHED ? "Published" : "Draft"}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <label htmlFor="public" className="group relative flex items-start gap-3 cursor-pointer select-none">
          <input id="public" type="checkbox" {...register("public")} className="sr-only peer" />
          <div className="flex items-center justify-center mt-0.5 w-6 h-6 rounded-md border-2 transition-all duration-150
                           border-slate-500 peer-checked:border-transparent peer-checked:bg-gradient-to-tr peer-checked:from-[#ba7bf0] peer-checked:via-[#996bec] peer-checked:to-[#5046e4]
                           peer-focus:ring-2 peer-focus:ring-offset-1 peer-focus:ring-[#ba7bf0]/40" aria-hidden>
            <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-black">Make this course public</span>
            <span className="text-xs text-slate-400">
              When public, students can find and enroll in this course. You can still edit content after publishing.
            </span>
          </div>
        </label>

        <div className="border border-white/6 rounded-lg p-4 bg-white/2">
          <p className="text-sm font-medium text-black mb-3">Course Features</p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("requiresApproval")} className="sr-only peer" />
            <div className="w-10 h-6 rounded-full p-1 bg-[#000000]/15 peer-checked:bg-gradient-to-tr peer-checked:from-[#ba7bf0] peer-checked:to-[#5046e4] transition">
              <span className="block w-4 h-4 rounded-full bg-white transform peer-checked:translate-x-4 transition" />
            </div>
            <div>
              <div className="text-sm text-black font-medium">Require Instructor Approval for Enrollment</div>
              <div className="text-xs text-slate-400">Students must be approved by the instructor before access is granted</div>
            </div>
          </label>

          <hr className="my-3 border-t border-white/5" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...register("sandboxEnabled")} className="sr-only peer" />
              <div className="w-10 h-6 rounded-full p-1 bg-[#000000]/15 peer-checked:bg-gradient-to-r peer-checked:from-[#ba7bf0] peer-checked:to-[#5046e4] transition">
                <span className="block w-4 h-4 rounded-full bg-white transform peer-checked:translate-x-4 transition" />
              </div>
              <div>
                <div className="text-sm text-black font-medium">Enable Sandbox</div>
                <div className="text-xs text-slate-400">Students can run code in an embedded sandbox</div>
              </div>
            </label>

            <div className={`flex items-center gap-2 ${!sandboxEnabled ? "opacity-50 pointer-events-none" : ""}`}>
              <label className="text-sm text-vilot-200">Language</label>
              <select {...register("sandboxLanguage")} className="rounded-md p-1 bg-transparent border border-slate-700 text-sm">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>

          <hr className="my-3 border-t border-white/5" />

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("notesEnabled")} className="sr-only peer" />
            <div className="w-10 h-6 rounded-full p-1 bg-[#000000]/15 peer-checked:bg-gradient-to-r peer-checked:from-[#ba7bf0] peer-checked:to-[#5046e4] transition">
              <span className="block w-4 h-4 rounded-full bg-white transform peer-checked:translate-x-4 transition" />
            </div>
            <div>
              <div className="text-sm text-black font-medium">Allow Notes</div>
              <div className="text-xs text-slate-400">Enable student personal notes for the course sections</div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 mt-5">
          <Button
            disabled={loading}
            variant="light"
            onClick={goBack}
            className="w-xs bg-white text-black"
            style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
            animated={false}
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="w-xs"
            style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
            animated={true}
          >
            {loading ? (
              <>
                Saving...
              </>
            ) : (
              <>
                <p>Save Changes</p>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
