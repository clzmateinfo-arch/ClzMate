import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { editCourseDetails } from "@/entities/course/model/courseDetailsAPI";
import { resetCourseState, setStep } from "@/entities/course/model/courseSlice";
import { COURSE_STATUS } from "@/utils/constants";
import IconBtn from "@/shared/components/ui/IconBtn";

export default function PublishCourse() {
  const { register, handleSubmit, setValue, getValues } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { course } = useSelector((state) => state.course);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course?.status === COURSE_STATUS.PUBLISHED) setValue("public", true);
  }, [course, setValue, useLocation().pathname]);

  const goBack = () => dispatch(setStep(2));
  const goToCourses = () => {
    dispatch(resetCourseState());
    navigate("/dashboard/my-courses");
  };

  const handleCoursePublish = async () => {
    const publicFlag = getValues("public");
    if ((course?.status === COURSE_STATUS.PUBLISHED && publicFlag === true) || (course?.status === COURSE_STATUS.DRAFT && publicFlag === false)) {
      goToCourses();
      return;
    }
    const formData = new FormData();
    formData.append("courseId", course._id);
    formData.append("status", publicFlag ? COURSE_STATUS.PUBLISHED : COURSE_STATUS.DRAFT);
    setLoading(true);
    const result = await editCourseDetails(formData, token);
    setLoading(false);
    if (result) goToCourses();
  };

  const onSubmit = () => handleCoursePublish();

  return (
    <div className="rounded-2xl border border-white/8 bg-white/6 p-6">
      <p className="text-xl font-semibold text-richblack-900">Publish Settings</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" id="public" {...register("public")} className="h-4 w-4 rounded border-gray-300" />
          <span className="text-richblack-900">Make this course public</span>
        </label>

        <div className="flex justify-end gap-3">
          <button disabled={loading} type="button" onClick={goBack} className="rounded-md py-2 px-4 border border-white/8">Back</button>
          <IconBtn disabled={loading} text="Save Changes" customClasses="bg-violet-600 text-white" />
        </div>
      </form>
    </div>
  );
}
