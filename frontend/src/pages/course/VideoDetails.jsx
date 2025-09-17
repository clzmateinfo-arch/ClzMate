import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { markLectureAsComplete, getSignedAssetUrl } from "@/entities/course/model/courseDetailsAPI";
import { updateCompletedLectures } from "@/entities/course/model/courseSlice";
import { setCourseViewSidebar } from "@/entities/ui/sidebarSlice";
import IconBtn from "@/shared/components/ui/IconBtn";
import { HiMenuAlt1 } from "react-icons/hi";

const VideoDetails = () => {
  const { courseId, sectionId, subSectionId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth || {});

  const { courseSectionData, courseEntireData, completedLectures } = useSelector((state) => {
  const slice = state.course || {};
  return {
    courseSectionData: slice.courseSectionData ?? [],
    courseEntireData: slice.courseEntireData ?? {},
    completedLectures: slice.completedLectures ?? [],
  };
});

  const [videoData, setVideoData] = useState(null);
  const [previewSource, setPreviewSource] = useState("");
  const [videoEnded, setVideoEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signedMediaUrl, setSignedMediaUrl] = useState(null);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState(null);

  useEffect(() => {
    if (!courseSectionData || !courseSectionData.length) {
      setVideoData(null);
      return;
    }

    const section = courseSectionData.find((s) => s._id === sectionId);
    if (!section) {
      setVideoData(null);
      return;
    }
    const sub = (section.subSection || []).find((ss) => ss._id === subSectionId);
    setVideoData(sub || null);

    setPreviewSource(courseEntireData?.thumbnail || "");
    setSignedPreviewUrl(null);
    setVideoEnded(false);
  }, [courseSectionData, courseEntireData, useLocation().pathname]);

  useEffect(() => {
    (async () => {
      if (!previewSource) {
        setSignedPreviewUrl(null);
        return;
      }
      if (token) {
        try {
          const url = await getSignedAssetUrl({ publicId: null, resourceType: "auto", type: "authenticated", url: previewSource }, token);

          setSignedPreviewUrl(url || previewSource);
        } catch (e) {
          setSignedPreviewUrl(previewSource);
        }
      } else {
        setSignedPreviewUrl(previewSource);
      }
    })();
  }, [previewSource, token]);

  useEffect(() => {
    (async () => {
      setSignedMediaUrl(null);
      if (!videoData) return;

      let candidate = null;

      if (Array.isArray(videoData.supportMaterials) && videoData.supportMaterials.length) {

        candidate = videoData.supportMaterials.find((s) => !!s.isMainVideo);

        if (!candidate) candidate = videoData.supportMaterials.find((s) => (s.resourceType || "").startsWith("video"));

        if (!candidate) candidate = videoData.supportMaterials[0];
      }

      if (!candidate && (videoData.videoUrl || videoData.videoPublicId)) {
        candidate = {
          url: videoData.videoUrl,
          publicId: videoData.videoPublicId,
          resourceType: videoData.resource_type || "video",
        };
      }

      if (!candidate) {
        setSignedMediaUrl(null);
        return;
      }

      const publicId = candidate.publicId || null;
      const resourceType = candidate.resourceType || "auto";

      try {
        let signed = null;
        if (publicId) {
          signed = await getSignedAssetUrl({ publicId, resourceType, type: "authenticated" }, token);
        } else if (candidate.url) {
          signed = await getSignedAssetUrl({ publicId: null, resourceType, type: "authenticated", url: candidate.url }, token);
        }
        setSignedMediaUrl(signed || candidate.url || null);
      } catch (e) {
        console.warn("Failed to get signed media url:", e);
        setSignedMediaUrl(candidate.url || null);
      }
    })();
  }, [videoData, token]);

  const isFirstVideo = () => {
    const currentSectionIndx = (courseSectionData || []).findIndex((data) => data._id === sectionId);
    if (currentSectionIndx === -1) return true;
    const currentSubSectionIndx = (courseSectionData[currentSectionIndx]?.subSection || []).findIndex((data) => data._id === subSectionId);
    return currentSectionIndx === 0 && currentSubSectionIndx === 0;
  };

  const goToNextVideo = () => {
    const currentSectionIndx = (courseSectionData || []).findIndex((data) => data._id === sectionId);
    if (currentSectionIndx === -1) return;
    const subSections = courseSectionData[currentSectionIndx]?.subSection || [];
    const noOfSubsections = subSections.length;
    const currentSubSectionIndx = subSections.findIndex((data) => data._id === subSectionId);
    if (currentSubSectionIndx === -1) return;

    if (currentSubSectionIndx !== noOfSubsections - 1) {
      const nextSubSectionId = subSections[currentSubSectionIndx + 1]._id;
      navigate(`/view-course/${courseId}/section/${sectionId}/sub-section/${nextSubSectionId}`);
    } else {
      const nextSection = courseSectionData[currentSectionIndx + 1];
      if (!nextSection) return;
      const nextSectionId = nextSection._id;
      const nextSubSectionId = nextSection.subSection[0]._id;
      navigate(`/view-course/${courseId}/section/${nextSectionId}/sub-section/${nextSubSectionId}`);
    }
  };

  const isLastVideo = () => {
    const currentSectionIndx = (courseSectionData || []).findIndex((data) => data._id === sectionId);
    if (currentSectionIndx === -1) return true;
    const noOfSubsections = (courseSectionData[currentSectionIndx]?.subSection || []).length;
    const currentSubSectionIndx = (courseSectionData[currentSectionIndx]?.subSection || []).findIndex((data) => data._id === subSectionId);
    return currentSectionIndx === (courseSectionData || []).length - 1 && currentSubSectionIndx === noOfSubsections - 1;
  };

  const goToPrevVideo = () => {
    const currentSectionIndx = (courseSectionData || []).findIndex((data) => data._id === sectionId);
    if (currentSectionIndx === -1) return;
    const currentSubSectionIndx = (courseSectionData[currentSectionIndx]?.subSection || []).findIndex((data) => data._id === subSectionId);
    if (currentSubSectionIndx === -1) return;

    if (currentSubSectionIndx !== 0) {
      const prevSubSectionId = courseSectionData[currentSectionIndx].subSection[currentSubSectionIndx - 1]._id;
      navigate(`/view-course/${courseId}/section/${sectionId}/sub-section/${prevSubSectionId}`);
    } else {
      const prevSection = courseSectionData[currentSectionIndx - 1];
      if (!prevSection) return;
      const prevSectionId = prevSection._id;
      const prevSubSectionId = prevSection.subSection[prevSection.subSection.length - 1]._id;
      navigate(`/view-course/${courseId}/section/${prevSectionId}/sub-section/${prevSubSectionId}`);
    }
  };

  const handleLectureCompletion = async () => {
    setLoading(true);
    const res = await markLectureAsComplete({ courseId: courseId, subsectionId: subSectionId }, token);
    if (res) {
      dispatch(updateCompletedLectures(subSectionId));
    }
    setLoading(false);
  };

  const { courseViewSidebar } = useSelector((state) => state.sidebar || {});
  if (courseViewSidebar && window.innerWidth <= 640) return null;

  const onVideoEnded = () => setVideoEnded(true);

  const handleRewatch = () => {
    const el = playerRef.current;
    if (el) {
      try {
        el.currentTime = 0;
        el.play().catch(() => { });
        setVideoEnded(false);
      } catch (e) {
        console.warn("Rewatch failed:", e);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5 text-white">
      <div className="sm:hidden text-white absolute left-7 top-3 cursor-pointer " onClick={() => dispatch(setCourseViewSidebar(!courseViewSidebar))}>
        {!courseViewSidebar && <HiMenuAlt1 size={33} />}
      </div>

      {/* If no video content, show the preview thumbnail (signed) */}
      {!videoData || !signedMediaUrl ? (
        <img src={signedPreviewUrl || previewSource} alt="Preview" className="h-full w-full rounded-md object-cover" />
      ) : (
        <div className="relative w-full rounded-md bg-black">
          <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
            <video
              ref={playerRef}
              src={signedMediaUrl}
              poster={signedPreviewUrl || previewSource || undefined}
              controls
              playsInline
              autoPlay
              onEnded={onVideoEnded}
              className="w-full h-full object-cover"
            />
          </div>

          {videoEnded && (
            <div style={{ backgroundImage: "linear-gradient(to top, rgb(0, 0, 0), rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.1))" }} className="absolute inset-0 z-[100] grid h-full place-content-center text-center">
              {!completedLectures.includes(subSectionId) && (
                <IconBtn disabled={loading} onclick={() => handleLectureCompletion()} text={!loading ? "Mark As Completed" : "Loading"} customClasses="text-xl max-w-max px-4 mx-auto bg-violet-600" />
              )}

              <IconBtn disabled={loading} onclick={handleRewatch} text="Rewatch" customClasses="text-xl max-w-max px-4 mx-auto mt-2 bg-violet-600" />

              <div className="mt-10 flex min-w-[250px] justify-center gap-x-4 text-xl">
                {!isFirstVideo() && <button disabled={loading} onClick={goToPrevVideo} className="blackButton">Prev</button>}
                {!isLastVideo() && <button disabled={loading} onClick={goToNextVideo} className="blackButton">Next</button>}
              </div>
            </div>
          )}
        </div>
      )}

      <h1 className="mt-4 text-3xl font-semibold">{videoData?.title}</h1>
      <p className="pt-2 pb-6">{videoData?.description}</p>
    </div>
  );
};

export default VideoDetails;
