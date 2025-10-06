import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Box from "../../shared/components/app/Box";
import NotePanel from "../../shared/components/app/NotePanel";
import SandboxPanel from "../../shared/components/app/SandboxPanel";
import SupportFilesPanel from "../../shared/components/app/SupportFilesPanel";
import SectionSidebar from "../../shared/components/app/SectionSidebar";
import ExternalVideo from "../../shared/components/app/ExternalVideo";
import Whiteboard from "../../shared/components/app/Whiteboard";
import ResourceViewer from "../../shared/components/app/ResourceViewer";
import { generateCourseLayout } from "../../shared/utils/generateCourseLayout";
import { getFullDetailsOfCourse } from "../../entities/course/model/courseDetailsAPI";
import {
  setCourseSectionData,
  setEntireCourseData,
  setCompletedLectures,
  setTotalNoOfLectures,
  setDrawMode,
} from "../../entities/course/model/courseSlice";

const DEFAULT_SECTION_WIDTH = 15;

export default function ViewCourse() {
  const { courseId, sectionId, subSectionId } = useParams();
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth || {});
  const token = auth.token;
  const courseSlice = useSelector((s) => s.course || {});
  const courseSectionData = courseSlice.courseSectionData || [];
  const courseEntireData = courseSlice.courseEntireData || {};
  const [loading, setLoading] = useState(false);

  const [boxes, setBoxes] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);

  const { drawMode } = useSelector((s) => s.course || {});
  const [wbStatus, setWbStatus] = useState("idle");
  const wbRef = useRef(null);

  const location = useLocation();
  const fromClassroom = !!(location && location.state && location.state.fromClassroom);
  const originatingClassroomId = location?.state?.classroomId || null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getFullDetailsOfCourse(courseId, token);
        if (!mounted) return;
        if (data) {
          dispatch(setCourseSectionData(data.courseDetails.courseContent || []));
          dispatch(setEntireCourseData(data.courseDetails || {}));
          dispatch(setCompletedLectures(data.completedVideos || []));
          let lectures = 0;
          data?.courseDetails?.courseContent?.forEach((s) => {
            lectures += (s.subSection || []).length;
          });
          dispatch(setTotalNoOfLectures(lectures));
        }
      } catch (e) {
        console.error("Course view-course load failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, token, dispatch]);

  useEffect(() => {
    if (!courseSectionData || !courseSectionData.length) {
      setCurrentSub(null);
      return;
    }
    const sec = courseSectionData.find((s) => s._id === sectionId) || courseSectionData[0];
    const sub = (sec?.subSection || []).find((ss) => ss._id === subSectionId) || sec?.subSection?.[0] || null;
    setCurrentSub(sub);
  }, [courseSectionData, sectionId, subSectionId]);

  useEffect(() => {
    const features = courseEntireData?.features ?? { sandboxEnabled: false, sandboxLanguage: "javascript", notesEnabled: true };
    const layout = generateCourseLayout({ features, currentSub, sectionWidth: DEFAULT_SECTION_WIDTH });

    const boxesMapped = layout.map((tile) => {
      if (tile.id === "section") {
        return {
          ...tile,
          visible: true,
          z: 300,
          component: SectionSidebar,
          componentProps: {
            course: courseEntireData,
            sections: courseSectionData,
            currentSectionId: sectionId,
            currentSubId: subSectionId,
            showBackToClassroom: fromClassroom,
            classroomId: originatingClassroomId
          },
        };
      }

      if (tile.id === "external") {
        return {
          ...tile,
          visible: true,
          z: 210,
          component: ExternalVideo,
          componentProps: { url: currentSub?.externalVideoUrl ?? null },
        };
      }

      if (tile.id === "video") {
        const mats = currentSub?.supportMaterials || [];
        const mainVideo = mats.find((m) => !!m.isMainVideo) || mats.find((m) => (m.resourceType || "").startsWith("video"));
        return {
          ...tile,
          visible: true,
          z: 200,
          component: ResourceViewer,
          componentProps: { resource: mainVideo, course: courseEntireData, token },
        };
      }

      if (tile.id === "pdf") {
        const mats = currentSub?.supportMaterials || [];
        const mainPdf = mats.find((m) => !!m.isMainPdf) || mats.find((m) => (m.mimeType || "").toLowerCase() === "application/pdf");
        return {
          ...tile,
          visible: true,
          z: 190,
          component: ResourceViewer,
          componentProps: { resource: mainPdf, course: courseEntireData, token },
        };
      }

      if (tile.id === "notes") {
        return {
          ...tile,
          visible: true,
          z: 180,
          component: NotePanel,
          componentProps: { courseId, sectionId, subSectionId, userId: auth?.user?.id },
        };
      }

      if (tile.id === "support") {
        return {
          ...tile,
          visible: true,
          z: 170,
          component: SupportFilesPanel,
          componentProps: { supportMaterials: (currentSub && currentSub.supportMaterials) || [] },
        };
      }

      if (tile.id === "sandbox") {
        return {
          ...tile,
          visible: true,
          z: 160,
          component: SandboxPanel,
          componentProps: { language: (courseEntireData?.features?.sandboxLanguage) || "python" },
        };
      }

      return { ...tile, visible: true, z: 120, component: () => null, componentProps: {} };
    });

    setBoxes(boxesMapped);
  }, [courseEntireData, courseSectionData, currentSub, sectionId, subSectionId, token, auth, courseId]);

  const dragState = useRef(null);
  const resizeState = useRef(null);

  const bringToFront = useCallback((id) => {
    setBoxes((prev) => {
      const maxZ = prev.length ? Math.max(...prev.map((p) => (typeof p.z === "number" ? p.z : 10))) : 10;
      return prev.map((p) => (p.id === id ? { ...p, z: maxZ + 1 } : p));
    });
  }, []);

  const onPointerDownDrag = useCallback((e, id) => {
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    bringToFront(id);

    setBoxes((prevBoxes) => {
      const box = prevBoxes.find((b) => b.id === id);
      if (!box) return prevBoxes;

      dragState.current = {
        id,
        startX: clientX,
        startY: clientY,
        startLeft: box.left,
        startTop: box.top,
      };

      window.addEventListener("mousemove", onPointerMoveDrag);
      window.addEventListener("touchmove", onPointerMoveDrag, { passive: false });
      window.addEventListener("mouseup", onPointerUpDrag);
      window.addEventListener("touchend", onPointerUpDrag);

      return prevBoxes;
    });
  }, [bringToFront]);

  const onPointerMoveDrag = useCallback((e) => {
    if (!dragState.current) return;
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    const { id, startX, startY, startLeft, startTop } = dragState.current;
    const dx = clientX - startX;
    const dy = clientY - startY;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const newLeft = Math.max(0, Math.min(100, startLeft + (dx / vw) * 100));
    const newTop = Math.max(0, Math.min(100, startTop + (dy / vh) * 100));
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, left: newLeft, top: newTop } : b)));
    e?.preventDefault?.();
  }, []);

  const onPointerUpDrag = useCallback(() => {
    dragState.current = null;
    window.removeEventListener("mousemove", onPointerMoveDrag);
    window.removeEventListener("touchmove", onPointerMoveDrag);
    window.removeEventListener("mouseup", onPointerUpDrag);
    window.removeEventListener("touchend", onPointerUpDrag);
  }, [onPointerMoveDrag]);

  const onPointerDownResize = useCallback((e, id) => {
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    bringToFront(id);

    setBoxes((prev) => {
      const box = prev.find((b) => b.id === id);
      if (!box) return prev;
      resizeState.current = {
        id,
        startX: clientX,
        startY: clientY,
        startW: box.width,
        startH: box.height,
      };

      window.addEventListener("mousemove", onPointerMoveResize);
      window.addEventListener("touchmove", onPointerMoveResize, { passive: false });
      window.addEventListener("mouseup", onPointerUpResize);
      window.addEventListener("touchend", onPointerUpResize);
      return prev;
    });
  }, [bringToFront]);

  const onPointerMoveResize = useCallback((e) => {
    if (!resizeState.current) return;
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    const { id, startX, startY, startW, startH } = resizeState.current;
    const dx = clientX - startX;
    const dy = clientY - startY;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const deltaW = (dx / vw) * 100;
    const deltaH = (dy / vh) * 100;
    const newW = Math.max(10, Math.min(100, startW + deltaW));
    const newH = Math.max(10, Math.min(100, startH + deltaH));
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, width: newW, height: newH } : b)));
    e?.preventDefault?.();
  }, []);

  const onPointerUpResize = useCallback(() => {
    resizeState.current = null;
    window.removeEventListener("mousemove", onPointerMoveResize);
    window.removeEventListener("touchmove", onPointerMoveResize);
    window.removeEventListener("mouseup", onPointerUpResize);
    window.removeEventListener("touchend", onPointerUpResize);
  }, [onPointerMoveResize]);

  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  const toggleBox = useCallback((id) => {
    setBoxes((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b));
      const toggled = updated.find((u) => u.id === id);
      if (toggled && toggled.visible) {
        const maxZ = updated.length ? Math.max(...updated.map((p) => (typeof p.z === "number" ? p.z : 0))) : 0;
        return updated.map((p) => (p.id === id ? { ...p, z: maxZ + 1 } : p));
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "d" || e.key === "D") {
        dispatch(setDrawMode(!drawMode));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dispatch, drawMode]);

  return (
    <div className="w-screen h-screen bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-4 right-4 z-[900] flex flex-col items-end gap-2">
      </div>

      <input
        id={`wb-import-${courseId}`}
        accept="application/json"
        type="file"
        className="hidden"
        onChange={(ev) => {
          const f = ev.target.files && ev.target.files[0];
          if (!f) return;
          if (wbRef.current && wbRef.current.importFile) {
            wbRef.current.importFile(f);
          } else {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const parsed = JSON.parse(e.target.result);
                localStorage.setItem(`whiteboard:${courseId}`, JSON.stringify(parsed));
              } catch (err) {
                console.warn("json parse error in whiteboard");
              }
            };
            reader.readAsText(f);
          }
          ev.target.value = "";
        }}
      />

      <div className="w-full h-full relative bg-white">
        {boxes.map((b) => (
          <Box
            key={b.id}
            box={b}
            component={b.component}
            componentProps={{
              ...(b.componentProps || {}),
              currentSub,
              course: courseEntireData,
              courseEntireData,
              sections: courseSectionData,
              courseId,
              sectionId,
              subSectionId,
              token,
              auth,
            }}
            onPointerDownDrag={onPointerDownDrag}
            onPointerDownResize={onPointerDownResize}
            toggleBox={toggleBox}
            onBringToFront={bringToFront}
          />
        ))}

        <div
          className="fixed inset-0 z-[800]"
          aria-hidden={!drawMode}
          style={{
            display: drawMode ? "block" : "none",
            pointerEvents: drawMode ? "auto" : "none",
            background: "transparent",
          }}
        >
          <div
            className="fixed inset-0 z-[800]"
            aria-hidden={!drawMode || !fromClassroom}
            style={{
              display: drawMode && fromClassroom ? "block" : "none",
              pointerEvents: drawMode && fromClassroom ? "auto" : "none",
              background: "transparent",
            }}
          >
            <Whiteboard
              ref={wbRef}
              courseId={courseId}
              onStatusChange={(s) => {
                setWbStatus(s);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
