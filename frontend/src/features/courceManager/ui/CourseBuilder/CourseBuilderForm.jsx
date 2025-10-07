import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { IoAddCircleOutline, IoCloseCircleOutline  } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { createSection, updateSection } from "@/entities/course/model/courseDetailsAPI";
import { setCourse, setEditCourse, setStep } from "@/entities/course/model/courseSlice";
import IconBtn from "@/shared/components/ui/IconBtn";
import NestedView from "./NestedView";
import Input from "@/shared/components/ui/Input";
import Button from "../../../../shared/components/ui/Button";

export default function CourseBuilderForm() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const { course } = useSelector((state) => state.course);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [editSectionName, setEditSectionName] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    let result;
    if (editSectionName) {
      result = await updateSection({ sectionName: data.sectionName, sectionId: editSectionName, courseId: course._id }, token);
    } else {
      result = await createSection({ sectionName: data.sectionName, courseId: course._id }, token);
    }
    if (result) {
      dispatch(setCourse(result));
      setEditSectionName(null);
      setValue("sectionName", "");
    } else {
      toast.error("Could not save section");
    }
    setLoading(false);
  };

  const cancelEdit = () => {
    setEditSectionName(null);
    setValue("sectionName", "");
  };

  const handleChangeEditSectionName = (sectionId, sectionName) => {
    if (editSectionName === sectionId) {
      cancelEdit();
      return;
    }
    setEditSectionName(sectionId);
    setValue("sectionName", sectionName);
  };

  const goToNext = () => {
    if (!course?.courseContent || course.courseContent.length === 0) {
      toast.error("Please add at least one section");
      return;
    }
    if (course.courseContent.some((section) => (section.subSection || []).length === 0)) {
      toast.error("Please add at least one lecture in each section");
      return;
    }
    dispatch(setStep(3));
  };

  const goBack = () => {
    dispatch(setStep(1));
    dispatch(setEditCourse(true));
  };

  return (
    <div className="space-y-6 rounded-2xl border border-white/8 bg-white/6 p-6">

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="my-2 flex items-end">
          <Input
            id="sectionName"
            label="Section Name"
            placeholder="Add a section to build your course"
            {...register("sectionName", { required: true })}
            error={errors.sectionName}
          />
          {editSectionName && (
            <div className="ml-5 mb-[3px] items-center-safe align-middle">
              <IconBtn type="button" onClick={cancelEdit} disabled={loading} text={"Cancel Edit"} outline customClasses="bg-violet-600" textClass="text-black">
                <IoCloseCircleOutline size={18} />
              </IconBtn>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <IconBtn type="submit" disabled={loading} text={editSectionName ? "Save" : "Create Section"} outline customClasses="bg-violet-600" textClass="text-black">
            <IoAddCircleOutline size={18} />
          </IconBtn>
        </div>
      </form>

      {course?.courseContent?.length > 0 && <NestedView handleChangeEditSectionName={handleChangeEditSectionName} />}

      <div className="flex justify-end gap-3 mt-5">
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
          disabled={loading}
          onClick={goToNext}
          className="w-xs"
          style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
          animated={true}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
