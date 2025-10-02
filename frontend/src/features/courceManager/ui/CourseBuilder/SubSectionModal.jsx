import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-hot-toast";
import { RxCross2 } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { createSubSection, updateSubSection, getSignedAssetUrl } from "@/entities/course/model/courseDetailsAPI";
import { setCourse } from "@/entities/course/model/courseSlice";
import IconBtn from "@/shared/components/ui/IconBtn";
import Upload from "@/shared/components/ui/Upload";
import MultiUpload from "@/shared/components/ui/MultiUpload";
import { useLocation } from "react-router-dom";
import Input from "@/shared/components/ui/Input";
import Textarea from "../../../../shared/components/ui/Textarea";

export default function SubSectionModal({ modalData, setModalData, add = false, view = false, edit = false, disabled = false }) {
  const { register, control, handleSubmit, setValue, reset, formState: { errors }, getValues, watch } = useForm({
    defaultValues: {
      lectureTitle: "",
      lectureDesc: "",
      lectureVideo: null,
      lecturePdf: null,
      supportMaterials: { existing: [], new: [], remove: [] },
    },
  });

  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const { course } = useSelector((state) => state.course);
  const loc = useLocation();

  const normalizeSupportForForm = (incoming = []) => {
    if (!Array.isArray(incoming) || !incoming.length) return [];
    return incoming.map((it) => {
      if (!it) return null;
      return {
        url: it.url ?? it.pdfUrl ?? it.videoUrl ?? null,
        publicId: it.publicId ?? it.pdfPublicId ?? it.videoPublicId ?? it._id ?? null,
        originalName: it.originalName ?? it.name ?? (it.url ? it.url.split("/").pop() : "file"),
        mimeType: it.mimeType ?? null,
        size: it.size ?? null,
        resourceType: it.resourceType ?? null,
        isMainVideo: !!it.isMainVideo,
        isMainPdf: !!it.isMainPdf,
        _id: it._id ?? null,
      };
    }).filter(Boolean);
  };

  useEffect(() => {
    if (view || edit) {
      reset({
        lectureTitle: modalData?.title ?? "",
        lectureDesc: modalData?.description ?? "",
        lectureVideo: null,
        lecturePdf: null,
        supportMaterials: {
          existing: normalizeSupportForForm(modalData?.supportMaterials),
          new: [],
          remove: [],
        },
      });

      (async () => {
        try {
          const existing = normalizeSupportForForm(modalData?.supportMaterials);
          const mainVideo = existing.find((s) => s.isMainVideo) ?? existing.find((s) => (s.mimeType || "").startsWith("video/"));
          const mainPdf = existing.find((s) => s.isMainPdf) ?? existing.find((s) => (s.mimeType || "").includes("pdf") || (s.originalName || "").toLowerCase().endsWith(".pdf"));

          if (mainVideo) {
            let signed = null;
            if (mainVideo.publicId) {
              signed = await getSignedAssetUrl({ publicId: mainVideo.publicId, resourceType: mainVideo.resourceType || undefined }, token);
            }
            setValue("lectureVideo", signed ?? mainVideo.url ?? null);
          } else {
            setValue("lectureVideo", modalData?.videoUrl ?? null);
          }

          if (mainPdf) {
            let signed = null;
            if (mainPdf.publicId) {
              signed = await getSignedAssetUrl({ publicId: mainPdf.publicId, resourceType: mainPdf.resourceType || undefined }, token);
            }
            setValue("lecturePdf", signed ?? mainPdf.url ?? null);
          } else {
            setValue("lecturePdf", modalData?.pdfUrl ?? modalData?.slidesUrl ?? modalData?.pdf ?? null);
          }
        } catch (err) {
          console.warn("Failed to obtain signed asset URL(s):", err);
          setValue("lectureVideo", modalData?.videoUrl ?? null);
          setValue("lecturePdf", modalData?.pdfUrl ?? modalData?.slidesUrl ?? modalData?.pdf ?? null);
        }
      })();
    } else {
      reset({
        lectureTitle: "",
        lectureDesc: "",
        lectureVideo: null,
        lecturePdf: null,
        supportMaterials: { existing: [], new: [], remove: [] },
      });
    }
  }, [modalData, view, edit, loc.pathname, token, reset, setValue]);

  const isFormUpdated = () => {
    const current = getValues();

    const origVideo = modalData?.videoUrl ?? null;
    const origPdf = modalData?.pdfUrl ?? modalData?.slidesUrl ?? modalData?.pdf ?? null;

    if ((current.lectureTitle ?? "") !== (modalData?.title ?? "")) return true;
    if ((current.lectureDesc ?? "") !== (modalData?.description ?? "")) return true;

    const curVideo = current.lectureVideo;
    if (curVideo && typeof curVideo !== "string") return true;
    if ((curVideo ?? null) !== (origVideo ?? null)) return true;

    const curPdf = current.lecturePdf;
    if (curPdf && typeof curPdf !== "string") return true;
    if ((curPdf ?? null) !== (origPdf ?? null)) return true;

    const support = current.supportMaterials ?? { existing: [], new: [], remove: [] };
    const newFiles = Array.isArray(support.new) ? support.new : [];
    const removeList = Array.isArray(support.remove) ? support.remove : [];
    const existingList = Array.isArray(support.existing) ? support.existing : [];

    if (newFiles.length > 0) return true;
    if (removeList.length > 0) return true;

    const origExisting = (modalData?.supportMaterials ?? []).map((it) =>
      (it && (it.url ?? it.pdfUrl ?? it.videoUrl ?? it.originalName ?? it.name)) || null
    ).filter(Boolean);

    const curExistingUrls = existingList.map((it) => (it && (it.url ?? it.originalName ?? it.publicId ?? it.name)) || null).filter(Boolean);

    if (origExisting.length !== curExistingUrls.length) return true;

    const setOrig = new Set(origExisting);
    const setCur = new Set(curExistingUrls);
    if (setOrig.size !== setCur.size) return true;
    for (const u of setOrig) {
      if (!setCur.has(u)) return true;
    }

    return false;
  };

  const buildSupportMaterialsMeta = (currentValues) => {
    const meta = [];
    const support = currentValues.supportMaterials ?? { existing: [], new: [], remove: [] };

    if (Array.isArray(support.new) && support.new.length) {
      support.new.forEach((f) => {
        const m = { originalName: f.name };
        const lectureVideoVal = currentValues.lectureVideo;
        if (lectureVideoVal && typeof lectureVideoVal !== "string" && lectureVideoVal.name === f.name) {
          m.isMainVideo = true;
        }
        const lecturePdfVal = currentValues.lecturePdf;
        if (lecturePdfVal && typeof lecturePdfVal !== "string" && lecturePdfVal.name === f.name) {
          m.isMainPdf = true;
        }
        meta.push(m);
      });
    }

    const lectureVideoVal = currentValues.lectureVideo;
    if (lectureVideoVal && typeof lectureVideoVal !== "string") {
      if (!meta.some((m) => m.originalName === lectureVideoVal.name)) {
        meta.push({ originalName: lectureVideoVal.name, isMainVideo: true });
      } else {
        meta.forEach((m) => { if (m.originalName === lectureVideoVal.name) m.isMainVideo = true; });
      }
    }

    const lecturePdfVal = currentValues.lecturePdf;
    if (lecturePdfVal && typeof lecturePdfVal !== "string") {
      if (!meta.some((m) => m.originalName === lecturePdfVal.name)) {
        meta.push({ originalName: lecturePdfVal.name, isMainPdf: true });
      } else {
        meta.forEach((m) => { if (m.originalName === lecturePdfVal.name) m.isMainPdf = true; });
      }
    }

    return meta;
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

    if (currentValues.lectureVideo && typeof currentValues.lectureVideo !== "string") {
      formData.append("video", currentValues.lectureVideo);
    }
    if (currentValues.lecturePdf && typeof currentValues.lecturePdf !== "string") {
      formData.append("pdf", currentValues.lecturePdf);
    }

    const support = currentValues.supportMaterials ?? { existing: [], new: [], remove: [] };

    if (Array.isArray(support.new) && support.new.length) {
      support.new.forEach((f) => formData.append("supportMaterials", f));
    }

    if (Array.isArray(support.remove) && support.remove.length) {
      formData.append("removeSupport", JSON.stringify(support.remove));
    }

    const meta = buildSupportMaterialsMeta(currentValues);
    if (meta.length) formData.append("supportMaterialsMeta", JSON.stringify(meta));

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

    if (currentValues.lectureVideo && typeof currentValues.lectureVideo !== "string") {
      formData.append("video", currentValues.lectureVideo);
    }
    if (currentValues.lecturePdf && typeof currentValues.lecturePdf !== "string") {
      formData.append("pdf", currentValues.lecturePdf);
    }

    const support = currentValues.supportMaterials ?? { existing: [], new: [], remove: [] };
    if (Array.isArray(support.new) && support.new.length) {
      support.new.forEach((f) => formData.append("supportMaterials", f));
    }

    const meta = buildSupportMaterialsMeta(currentValues);
    if (meta.length) formData.append("supportMaterialsMeta", JSON.stringify(meta));

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
              viewData={view ? getValues().lectureVideo : null}
              editData={edit ? getValues().lectureVideo : null}
              previewHeight={320}
              disabled={view}
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
              viewData={view ? getValues().lecturePdf : null}
              editData={edit ? getValues().lecturePdf : null}
              previewHeight={320}
              disabled={view}
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
              allowedTypes="image/*,video/*,application/pdf,.zip"
              disabled={!view}
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
                <Textarea
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
