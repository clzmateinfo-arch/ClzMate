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
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm();

  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth || {});

  // read both variants from your course slice — some flows set `course`, other flows set `courseEntireData`
  const courseSlice = useSelector((state) => state.course || {});
  const { course: courseFromSlice, editCourse, courseEntireData } = courseSlice;

  // prefer explicit 'course' if present, otherwise fall back to courseEntireData
  const courseData = editCourse ? (courseFromSlice || courseEntireData || {}) : null;

  const [loading, setLoading] = useState(false);
  const [courseCategories, setCourseCategories] = useState([]);

  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      const categories = await fetchCourseCategories();
      if (categories && categories.length > 0) setCourseCategories(categories);
      setLoading(false);
    };
    getCategories();
  }, []);

  useEffect(() => {
    // only populate form when editing and courseData is available
    if (editCourse && courseData) {
      // defensive defaults so undefined doesn't break fields
      setValue("courseTitle", courseData.courseName ?? "");
      setValue("courseShortDesc", courseData.courseDescription ?? "");
      setValue("coursePrice", courseData.price ?? 0);
      setValue("courseTags", courseData.tag ?? []);
      setValue("courseBenefits", courseData.whatYouWillLearn ?? "");
      setValue("courseCategory", courseData.category?._id ?? "");
      setValue("courseRequirements", courseData.instructions ?? []);
      setValue("courseImage", courseData.thumbnail ?? null);
    } else {
      // ensure category starts empty for new course
      setValue("courseCategory", "");
    }
    // only want to run when edit mode or courseData changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editCourse, courseData]);

  const isFormUpdated = () => {
    const currentValues = getValues();
    // if there's no courseData then it's a new course, treat as updated
    if (!editCourse || !courseData) return true;

    return (
      currentValues.courseTitle !== (courseData.courseName ?? "") ||
      currentValues.courseShortDesc !== (courseData.courseDescription ?? "") ||
      Number(currentValues.coursePrice) !== Number(courseData.price ?? 0) ||
      JSON.stringify(currentValues.courseTags ?? []) !== JSON.stringify(courseData.tag ?? []) ||
      currentValues.courseBenefits !== (courseData.whatYouWillLearn ?? "") ||
      (courseData.category && currentValues.courseCategory !== (courseData.category._id ?? "")) ||
      JSON.stringify(currentValues.courseRequirements ?? []) !==
      JSON.stringify(courseData.instructions ?? []) ||
      currentValues.courseImage !== (courseData.thumbnail ?? "")
    );
  };

  const onSubmit = async (data) => {
    // If editing
    if (editCourse && courseData) {
      if (!isFormUpdated()) {
        toast.error("No changes made to the form");
        return;
      }
      const currentValues = getValues();
      const formData = new FormData();
      formData.append("courseId", courseData._id);

      if (currentValues.courseTitle !== (courseData.courseName ?? ""))
        formData.append("courseName", data.courseTitle);
      if (currentValues.courseShortDesc !== (courseData.courseDescription ?? ""))
        formData.append("courseDescription", data.courseShortDesc);
      if (Number(currentValues.coursePrice) !== Number(courseData.price ?? 0))
        formData.append("price", data.coursePrice);
      if (
        JSON.stringify(currentValues.courseTags ?? []) !== JSON.stringify(courseData.tag ?? [])
      )
        formData.append("tag", JSON.stringify(data.courseTags));
      if (currentValues.courseBenefits !== (courseData.whatYouWillLearn ?? ""))
        formData.append("whatYouWillLearn", data.courseBenefits);
      if (currentValues.courseCategory !== (courseData.category?._id ?? ""))
        formData.append("category", data.courseCategory);
      if (
        JSON.stringify(currentValues.courseRequirements ?? []) !==
        JSON.stringify(courseData.instructions ?? [])
      )
        formData.append("instructions", JSON.stringify(data.courseRequirements));
      if (currentValues.courseImage !== (courseData.thumbnail ?? ""))
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

    // New course
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
        <Controller
          name="courseShortDesc"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextArea
              id="courseShortDesc"
              label="Course Short Description"
              placeholder="Enter Description"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              error={errors.courseShortDesc?.message}
              rows={6}
            />
          )}
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
          <Controller
            name="courseCategory"
            control={control}
            rules={{ required: "Please choose a category" }}
            defaultValue={editCourse ? courseData?.category?._id ?? "" : ""}
            render={({ field, fieldState }) => {
              const handleChangeFromSelect = (evt) => {
                if (evt && evt.target && "value" in evt.target) {
                  field.onChange(evt.target.value);
                } else {
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
          editData={editCourse ? courseData?.thumbnail : null}
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
        <Controller
          name="courseBenefits"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextArea
              id="courseBenefits"
              label="Benefits of the course"
              placeholder="Enter benefits of the course"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              error={errors.courseBenefits?.message}
              rows={6}
            />
          )}
        />
      </div>

      <div className="flex justify-end gap-3 mt-15">
        {editCourse && (
          <Button
            disabled={loading}
            variant="light"
            onClick={() => dispatch(setStep(2))}
            className="w-xs bg-white text-black"
            style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
            animated={false}
          >
            Continue Without Saving
          </Button>
        )}
        <Button
          disabled={loading}
          type="submit"
          className="w-xs"
          style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
          animated={true}
        >
          {!editCourse ? "Next" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
