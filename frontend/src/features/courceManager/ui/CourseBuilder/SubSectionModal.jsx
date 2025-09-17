// SubSectionModal.jsx
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-hot-toast";
import { RxCross2 } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { createSubSection, updateSubSection } from "@/entities/course/model/courseDetailsAPI";
import { setCourse } from "@/entities/course/model/courseSlice";
import IconBtn from "@/shared/components/ui/IconBtn";
import Upload from "@/shared/components/ui/Upload";
import MultiUpload from "@/shared/components/ui/MultiUpload";
import { useLocation } from "react-router-dom";
import Input from "@/shared/components/ui/Input";
import TextArea from "@/shared/components/ui/TextArea";

export default function SubSectionModal({ modalData, setModalData, add = false, view = false, edit = false }) {
  // include control and reset here
  const { register, control, handleSubmit, setValue, reset, formState: { errors }, getValues, watch } = useForm({
    defaultValues: {
      lectureTitle: "",
      lectureDesc: "",
      lectureVideo: null,
      lecturePdf: null,
      supportMaterials: [],
    },
  });

  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const { course } = useSelector((state) => state.course);
  const loc = useLocation();

  // reset form whenever modalData / mode changes
  useEffect(() => {
    if (view || edit) {
      reset({
        lectureTitle: modalData?.title ?? "",
        lectureDesc: modalData?.description ?? "",
        lectureVideo: modalData?.videoUrl ?? null,
        lecturePdf: modalData?.pdfUrl ?? modalData?.slidesUrl ?? modalData?.pdf ?? null,
        // supportMaterials: store as an object for MultiUpload
        supportMaterials: {
          existing: modalData?.supportMaterials?.map(it => ({
            url: it.url ?? it.pdfUrl ?? it.videoUrl ?? null,
            publicId: it.publicId ?? it.pdfPublicId ?? it.videoPublicId ?? it._id ?? null,
            originalName: it.originalName ?? it.name ?? (it.url ? it.url.split("/").pop() : "file"),
            mimeType: it.mimeType ?? null,
            size: it.size ?? null,
            _id: it._id ?? null,
          })) ?? [],
          new: [],
          remove: [],
        },
      });
    } else {
      reset({
        lectureTitle: "",
        lectureDesc: "",
        lectureVideo: null,
        lecturePdf: null,
        supportMaterials: { existing: [], new: [], remove: [] },
      });
    }
  }, [modalData, view, edit, loc.pathname, reset]);

  const isFormUpdated = () => {
    const current = getValues();
    const origVideo = modalData?.videoUrl ?? null;
    const origPdf = modalData?.pdfUrl ?? modalData?.slidesUrl ?? modalData?.pdf ?? null;
    return (
      current.lectureTitle !== (modalData?.title ?? "") ||
      current.lectureDesc !== (modalData?.description ?? "") ||
      current.lectureVideo !== origVideo ||
      current.lecturePdf !== origPdf
    );
  };

  const handleEditSubsection = async () => {
    const currentValues = getValues();

    if (!currentValues.lectureVideo && !currentValues.lecturePdf) {
      toast.error("Please upload either a video (MP4) or a PDF before saving.");
      return;
    }

    const formData = new FormData();
    formData.append("sectionId", modalData.sectionId);
    formData.append("subSectionId", modalData._id);
    if (currentValues.lectureTitle !== modalData.title) formData.append("title", currentValues.lectureTitle);
    if (currentValues.lectureDesc !== modalData.description) formData.append("description", currentValues.lectureDesc);
    if (currentValues.lectureVideo && currentValues.lectureVideo !== modalData.videoUrl) formData.append("video", currentValues.lectureVideo);
    if (currentValues.lecturePdf && currentValues.lecturePdf !== (modalData?.pdfUrl ?? modalData?.slidesUrl ?? modalData?.pdf)) formData.append("pdf", currentValues.lecturePdf);

    const support = getValues().supportMaterials ?? { existing: [], new: [], remove: [] };

    // append only new File objects
    if (Array.isArray(support.new) && support.new.length) {
      support.new.forEach((f) => formData.append("supportMaterials", f));
    }

    // tell backend which existing items to remove (publicIds or urls)
    if (Array.isArray(support.remove) && support.remove.length) {
      formData.append("removeSupport", JSON.stringify(support.remove));
    }

    setLoading(true);
    const result = await updateSubSection(formData, token);
    setLoading(false);

    if (result) {
      const updatedCourseContent = course.courseContent.map((section) => (section._id === modalData.sectionId ? result : section));
      const updatedCourse = { ...course, courseContent: updatedCourseContent };
      dispatch(setCourse(updatedCourse));
      setModalData(null);
    } else {
      toast.error("Failed to update lecture");
    }
  };

  const onSubmit = async (data) => {
    if (view) return;

    const currentValues = getValues();
    if (!currentValues.lectureVideo && !currentValues.lecturePdf) {
      toast.error("Please upload either a video (MP4) or a PDF.");
      return;
    }

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
    if (data.lectureVideo) formData.append("video", data.lectureVideo);
    if (data.lecturePdf) formData.append("pdf", data.lecturePdf);
    const support = getValues().supportMaterials ?? { existing: [], new: [], remove: [] };
    // append new local files only
    if (Array.isArray(support.new) && support.new.length) {
      support.new.forEach((f) => formData.append("supportMaterials", f));
    }

    setLoading(true);
    const result = await createSubSection(formData, token);
    setLoading(false);

    if (result) {
      const updatedCourseContent = course.courseContent.map((section) => (section._id === modalData ? result : section));
      const updatedCourse = { ...course, courseContent: updatedCourseContent };
      dispatch(setCourse(updatedCourse));
      setModalData(null);
    } else {
      toast.error("Failed to add lecture");
    }
  };

  // Watchers (optional)
  const watchedVideo = watch("lectureVideo");
  const watchedPdf = watch("lecturePdf");

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white/80 border border-white/60 rounded-2xl shadow-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/8 sticky top-0 bg-white/80 z-10">
          <h3 className="text-lg font-semibold text-richblack-900">{view ? "Viewing" : add ? "Add" : "Edit"} Lecture</h3>
          <button onClick={() => !loading && setModalData(null)} aria-label="close">
            <RxCross2 className="text-2xl text-richblack-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="my-3">
            <Upload
              name="lectureVideo"
              label="Lecture Video (MP4)"
              register={register}
              setValue={setValue}
              errors={errors}
              fileType="video"
              required={false}
              viewData={view ? modalData?.videoUrl : null}
              editData={edit ? modalData?.videoUrl : null}
              previewHeight={320}
            />
          </div>

          <div className="my-3">
            <Upload
              name="lecturePdf"
              label="Lecture Slides / Notes (PDF)"
              register={register}
              setValue={setValue}
              errors={errors}
              fileType="pdf"
              required={false}
              viewData={view ? (modalData?.pdfUrl ?? modalData?.slidesUrl ?? modalData?.pdf) : null}
              editData={edit ? (modalData?.pdfUrl ?? modalData?.slidesUrl ?? modalData?.pdf) : null}
              previewHeight={320}
            />
          </div>

          <div className="my-3">
            <MultiUpload
              name="supportMaterials"
              label="Support Materials"
              register={register}
              setValue={setValue}
              errors={errors}
              viewData={view ? modalData?.supportMaterials : null}
              editData={edit ? modalData?.supportMaterials : null}
            />
          </div>

          <div className="my-3">
            <Controller
              name="lectureTitle"
              control={control}
              rules={{ required: !view }}
              render={({ field }) => (
                <Input
                  id="lectureTitle"
                  label="Lecture Title"
                  placeholder="Enter Lecture Title"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.lectureTitle?.message}
                  disabled={view || loading}
                />
              )}
            />
          </div>

          <div className="my-3">
            <Controller
              name="lectureDesc"
              control={control}
              rules={{ required: !view }}
              render={({ field }) => (
                <TextArea
                  id="lectureDesc"
                  label="Lecture Description"
                  placeholder="Enter Lecture Description"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.lectureDesc?.message}
                  disabled={view || loading}
                  rows={6}
                />
              )}
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
