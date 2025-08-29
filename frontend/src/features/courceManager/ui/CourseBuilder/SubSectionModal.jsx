/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { RxCross2 } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { createSubSection, updateSubSection } from "@/entities/course/model/courseDetailsAPI";
import { setCourse } from "@/entities/course/model/courseSlice";
import IconBtn from "@/shared/components/ui/IconBtn";
import Upload from "@/shared/components/ui/Upload";
import { useLocation } from "react-router-dom";
import Input from "@/shared/components/ui/Input";
import Textarea from "@/shared/components/ui/TextArea";

export default function SubSectionModal({ modalData, setModalData, add = false, view = false, edit = false }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
  } = useForm();

  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const { course } = useSelector((state) => state.course);
  const loc = useLocation();

  // initialize form values when modal opens / mode changes
  useEffect(() => {
    if (view || edit) {
      setValue("lectureTitle", modalData?.title ?? "");
      setValue("lectureDesc", modalData?.description ?? "");
      // Upload component registers the file field itself, but we set value (existing url) so Upload can show preview
      setValue("lectureVideo", modalData?.videoUrl ?? null);
    } else {
      setValue("lectureTitle", "");
      setValue("lectureDesc", "");
      setValue("lectureVideo", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalData, view, edit, loc.pathname]);

  // NOTE: Upload registers the file input internally. Don't double-register here.
  // If you prefer to register here instead, remove the internal register from Upload.
  // useEffect(() => { register("lectureVideo", { required: !view }); }, [register, view]);

  // helper to extract register() result into props + ref for forwarded components
  const regWithRef = (name, rules = {}) => {
    const reg = register(name, rules);
    const { ref, ...rest } = reg;
    return { inputProps: rest, inputRef: ref };
  };

  const isFormUpdated = () => {
    const currentValues = getValues();
    return (
      currentValues.lectureTitle !== (modalData?.title ?? "") ||
      currentValues.lectureDesc !== (modalData?.description ?? "") ||
      currentValues.lectureVideo !== (modalData?.videoUrl ?? "")
    );
  };

  const handleEditSubsection = async () => {
    const currentValues = getValues();
    const formData = new FormData();
    formData.append("sectionId", modalData.sectionId);
    formData.append("subSectionId", modalData._id);
    if (currentValues.lectureTitle !== modalData.title) formData.append("title", currentValues.lectureTitle);
    if (currentValues.lectureDesc !== modalData.description) formData.append("description", currentValues.lectureDesc);
    if (currentValues.lectureVideo !== modalData.videoUrl) formData.append("video", currentValues.lectureVideo);

    setLoading(true);
    const result = await updateSubSection(formData, token);
    setLoading(false);

    if (result) {
      const updatedCourseContent = course.courseContent.map((section) =>
        section._id === modalData.sectionId ? result : section
      );
      const updatedCourse = { ...course, courseContent: updatedCourseContent };
      dispatch(setCourse(updatedCourse));
      setModalData(null);
    } else {
      toast.error("Failed to update lecture");
    }
  };

  const onSubmit = async (data) => {
    if (view) return;
    if (edit) {
      if (!isFormUpdated()) {
        toast.error("No changes made to the form");
        return;
      }
      await handleEditSubsection();
      return;
    }

    const formData = new FormData();
    formData.append("sectionId", modalData);
    formData.append("title", data.lectureTitle);
    formData.append("description", data.lectureDesc);
    formData.append("video", data.lectureVideo);

    setLoading(true);
    const result = await createSubSection(formData, token);
    setLoading(false);

    if (result) {
      const updatedCourseContent = course.courseContent.map((section) =>
        section._id === modalData ? result : section
      );
      const updatedCourse = { ...course, courseContent: updatedCourseContent };
      dispatch(setCourse(updatedCourse));
      setModalData(null);
    } else {
      toast.error("Failed to add lecture");
    }
  };

  // prepare register props + refs to pass to forwarded components
  const titleReg = regWithRef("lectureTitle", { required: !view });
  const descReg = regWithRef("lectureDesc", { required: !view });

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white/80 border border-white/60 rounded-2xl shadow-lg overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h3 className="text-lg font-semibold text-richblack-900">{view ? "Viewing" : add ? "Add" : "Edit"} Lecture</h3>
          <button onClick={() => !loading && setModalData(null)} aria-label="close">
            <RxCross2 className="text-2xl text-richblack-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="my-3 max-h-200">
            <Upload
              name="lectureVideo"
              label="Lecture Video"
              register={register}
              setValue={setValue}
              errors={errors}
              video
              viewData={view ? modalData?.videoUrl : null}
              editData={edit ? modalData?.videoUrl : null}
            />
          </div>

          <div className="my-3">
            <Input
              id="lectureTitle"
              label="Lecture Title"
              placeholder="Enter Lecture Title"
              {...titleReg.inputProps}
              ref={titleReg.inputRef}
              error={errors.lectureTitle?.message}
              disabled={view || loading}
            />
          </div>

          <div className="my-3">
            <Textarea
              id="lectureDesc"
              label="Lecture Description"
              placeholder="Enter Lecture Description"
              {...descReg.inputProps}
              ref={descReg.inputRef}
              error={errors.lectureDesc?.message}
              disabled={view || loading}
              rows={6}
            />
          </div>

          <div className="my-3">
            {!view && (
              <div className="flex justify-end">
                <IconBtn type="submit" disabled={loading} text={loading ? "Saving..." : edit ? "Save Changes" : "Save"} customClasses="bg-violet-600 text-white" />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
