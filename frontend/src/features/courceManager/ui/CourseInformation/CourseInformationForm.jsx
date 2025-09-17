/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-hot-toast";
import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { MdNavigateNext } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import {
  addCourseDetails,
  editCourseDetails,
  fetchCourseCategories,
} from "@/entities/course/model/courseDetailsAPI";
import { setCourse, setStep } from "@/entities/course/model/courseSlice";
import { COURSE_STATUS } from "@/utils/constants";
import IconBtn from "@/shared/components/ui/IconBtn";
import Upload from "../../../../shared/components/ui/Upload";
import ChipInput from "../../../../shared/components/ui/ChipInput";
import RequirementsField from "./RequirementField";
import Input from "../../../../shared/components/ui/Input";
import TextArea from "../../../../shared/components/ui/TextArea";
import Select from "@/shared/components/ui/Select";
import Button from "../../../../shared/components/ui/Button";

export default function CourseInformationForm() {
  // add Controller and control
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm();

  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { course, editCourse } = useSelector((state) => state.course);
  const [loading, setLoading] = useState(false);
  const [courseCategories, setCourseCategories] = useState([]);

  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      const categories = await fetchCourseCategories();
      if (categories.length > 0) setCourseCategories(categories);
      setLoading(false);
    };

    // populate defaults when editing
    if (editCourse && course) {
      setValue("courseTitle", course.courseName);
      setValue("courseShortDesc", course.courseDescription);
      setValue("coursePrice", course.price);
      setValue("courseTags", course.tag);
      setValue("courseBenefits", course.whatYouWillLearn);
      setValue("courseCategory", course.category?._id ?? "");
      setValue("courseRequirements", course.instructions);
      setValue("courseImage", course.thumbnail);
    } else {
      // ensure courseCategory default is present when creating
      setValue("courseCategory", "");
    }

    getCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editCourse, course]);

  const isFormUpdated = () => {
    const currentValues = getValues();
    return (
      currentValues.courseTitle !== course?.courseName ||
      currentValues.courseShortDesc !== course?.courseDescription ||
      Number(currentValues.coursePrice) !== Number(course?.price) ||
      JSON.stringify(currentValues.courseTags) !== JSON.stringify(course?.tag) ||
      currentValues.courseBenefits !== course?.whatYouWillLearn ||
      (course?.category && currentValues.courseCategory !== course.category._id) ||
      JSON.stringify(currentValues.courseRequirements) !==
      JSON.stringify(course?.instructions) ||
      currentValues.courseImage !== course?.thumbnail
    );
  };

  const onSubmit = async (data) => {
    if (editCourse && course) {
      if (!isFormUpdated()) {
        toast.error("No changes made to the form");
        return;
      }
      const currentValues = getValues();
      const formData = new FormData();
      formData.append("courseId", course._id);
      if (currentValues.courseTitle !== course.courseName)
        formData.append("courseName", data.courseTitle);
      if (currentValues.courseShortDesc !== course.courseDescription)
        formData.append("courseDescription", data.courseShortDesc);
      if (Number(currentValues.coursePrice) !== Number(course.price))
        formData.append("price", data.coursePrice);
      if (
        JSON.stringify(currentValues.courseTags) !== JSON.stringify(course.tag)
      )
        formData.append("tag", JSON.stringify(data.courseTags));
      if (currentValues.courseBenefits !== course.whatYouWillLearn)
        formData.append("whatYouWillLearn", data.courseBenefits);
      if (
        currentValues.courseCategory !== (course.category?._id ?? "")
      )
        formData.append("category", data.courseCategory);
      if (
        JSON.stringify(currentValues.courseRequirements) !==
        JSON.stringify(course.instructions)
      )
        formData.append("instructions", JSON.stringify(data.courseRequirements));
      if (currentValues.courseImage !== course.thumbnail)
        formData.append("thumbnailImage", data.courseImage);

      setLoading(true);
      const result = await editCourseDetails(formData, token);
      setLoading(false);
      if (result) {
        dispatch(setStep(2));
        dispatch(setCourse(result));
      }
      return;
    }

    const formData = new FormData();
    formData.append("courseName", data.courseTitle);
    formData.append("courseDescription", data.courseShortDesc);
    formData.append("price", data.coursePrice);
    formData.append("tag", JSON.stringify(data.courseTags));
    formData.append("whatYouWillLearn", data.courseBenefits);
    formData.append("category", data.courseCategory);
    formData.append("status", COURSE_STATUS.DRAFT);
    formData.append("instructions", JSON.stringify(data.courseRequirements));
    formData.append("thumbnailImage", data.courseImage);
    setLoading(true);
    const result = await addCourseDetails(formData, token);
    setLoading(false);
    if (result) {
      dispatch(setStep(2));
      dispatch(setCourse(result));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-2xl border border-white/8 bg-white/6 p-6"
    >
      <div className="mb-5">
        <Input
          label="Course Title"
          {...register("courseTitle", {
            required: "Please enter a course title",
          })}
          placeholder="Enter Course Title"
          error={errors.courseTitle?.message}
        />
      </div>

      <div className="mb-5">
        <TextArea
          label="Course Short Description"
          {...register("courseShortDesc", {
            required: "Please enter a short description",
          })}
          placeholder="Enter Description"
          error={errors.courseShortDesc?.message}
          rows={6}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Input
            label="Course Price"
            {...register("coursePrice", {
              required: "Please enter course price",
              valueAsNumber: true,
              pattern: {
                value: /^(0|[1-9]\d*)(\.\d+)?$/,
                message: "Invalid price",
              },
            })}
            placeholder="Enter Course Price"
            type="number"
            leftIcon={<HiOutlineCurrencyRupee />}
            inputClass="!pl-12"
            error={errors.coursePrice?.message}
          />
        </div>

        <div>
          {/* Use Controller for the custom Select */}
          <Controller
            name="courseCategory"
            control={control}
            rules={{ required: "Please choose a category" }}
            defaultValue={editCourse ? course?.category?._id ?? "" : ""}
            render={({ field, fieldState }) => {
              // Select calls onChange with syntheticEvent: { target: { name, value } }
              const handleChangeFromSelect = (evt) => {
                if (evt && evt.target && "value" in evt.target) {
                  field.onChange(evt.target.value);
                } else {
                  // fallback if Select sends raw value
                  field.onChange(evt);
                }
              };

              return (
                <Select
                  label="Course Category"
                  options={courseCategories.map((c) => ({
                    value: c._id,
                    label: c.name,
                  }))}
                  placeholder="Choose a category"
                  value={field.value}
                  onChange={handleChangeFromSelect}
                  error={fieldState?.error?.message}
                />
              );
            }}
          />
        </div>
      </div>

      <div className="mb-5">
        <ChipInput
          label="Tags"
          name="courseTags"
          placeholder="Enter Tags and press Enter or Comma"
          register={register}
          errors={errors}
          setValue={(k, v) => setValue(k, v)}
        />
      </div>

      <div className="mb-5">
        <Upload
          name="courseImage"
          label="Course Thumbnail"
          register={register}
          setValue={setValue}
          errors={errors}
          editData={editCourse ? course?.thumbnail : null}
        />
      </div>

      <div className="mb-5">
        <RequirementsField
          name="courseRequirements"
          label="Requirements/Instructions"
          register={register}
          setValue={setValue}
          errors={errors}
        />
      </div>

      <div className="mb-5">
        <TextArea
          label="Benefits of the course"
          {...register("courseBenefits", {
            required: "Please enter benefits of the course",
          })}
          placeholder="Enter benefits of the course"
          error={errors.courseBenefits?.message}
          rows={6}
        />
      </div>

      <div className="flex justify-end gap-3 mt-15">
        {editCourse && (
          <button
            type="button"
            onClick={() => dispatch(setStep(2))}
            disabled={loading}
            className="rounded-md py-2 px-4 border border-white/8"
          >
            Continue Without Saving
          </button>
        )}
        <Button
          disabled={loading}
          type="submit"
          classes="w-xs"
          style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
        >
          {!editCourse ? "Next" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
