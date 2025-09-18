// src/pages/course/ViewCourse.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PlayerPanel from "@/features/courseViewer/PlayerPanel";
import NotesPanel from "@/features/courseViewer/NotesPanel";
import SandboxPanel from "@/features/courseViewer/SandboxPanel";
import SupportFilesPanel from "@/features/courseViewer/SupportFilesPanel";
import SectionSidebar from "@/features/courseViewer/SectionSidebar";
import Box from "@/features/courseViewer/Box";
import { getFullDetailsOfCourse } from "@/entities/course/model/courseDetailsAPI";
import {
  setCourseSectionData,
  setEntireCourseData,
  setCompletedLectures,
  setTotalNoOfLectures,
} from "@/entities/course/model/courseSlice";
import ResourceViewer from "@/features/courseViewer/ResourceViewer";

const baseDefaultBoxes = [
  {
    id: "section",
    title: "Sections",
    type: "section",
    top: 0,
    left: 0,
    width: 15,
    height: 100,
    visible: true,
    z: 300,
    component: SectionSidebar,
    componentProps: {},
  },
  {
    id: "player",
    title: "Player",
    type: "player",
    top: 0,
    left: 15,
    width: 60,
    height: 60,
    visible: true,
    z: 200,
    component: PlayerPanel,
    componentProps: {},
  },
  {
    id: "sandbox",
    title: "Sandbox",
    type: "sandbox",
    top: 60,
    left: 15,
    width: 30,
    height: 40,
    visible: true,
    z: 150,
    component: SandboxPanel,
    componentProps: {},
  },
  {
    id: "notes",
    title: "Notes",
    type: "notes",
    top: 0,
    left: 75,
    width: 25,
    height: 50,
    visible: true,
    z: 180,
    component: NotesPanel,
    componentProps: {},
  },
  {
    id: "support",
    title: "Support Files",
    type: "support",
    top: 50,
    left: 75,
    width: 25,
    height: 50,
    visible: true,
    z: 170,
    component: SupportFilesPanel,
    componentProps: {},
  },
];

export default function ViewCourse() {
  const { courseId, sectionId, subSectionId } = useParams();
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth || {});
  const token = auth.token;
  const courseSlice = useSelector((s) => s.course || {});
  const courseSectionData = courseSlice.courseSectionData || [];
  const courseEntireData = courseSlice.courseEntireData || {};
  const [loading, setLoading] = useState(false);

  const [boxes, setBoxes] = useState(() =>
    baseDefaultBoxes.map((b) => ({ ...b, componentProps: { ...(b.componentProps || {}) } }))
  );
  const [currentSub, setCurrentSub] = useState(null);

  useEffect(() => {
    // build boxes array based on features
    const features = courseEntireData?.features ?? { sandboxEnabled: false, sandboxLanguage: "javascript", notesEnabled: true };

    const arr = [];

    // always section
    arr.push({
      id: "section",
      title: "Sections",
      type: "section",
      top: 0,
      left: 0,
      width: 15,
      height: 100,
      visible: true,
      z: 300,
      component: SectionSidebar,
      componentProps: { course: courseEntireData, sections: courseSectionData, currentSectionId: sectionId, currentSubId: subSectionId },
    });

    // player area (main player or resource) is added later based on currentSub supports (existing logic)
    // add notes only if enabled
    if (features.notesEnabled) {
      arr.push({
        id: "notes",
        title: "Notes",
        type: "notes",
        top: 0,
        left: 75,
        width: 25,
        height: 50,
        visible: true,
        z: 180,
        component: NotesPanel,
        componentProps: { courseId, sectionId, subSectionId, userId: auth?.user?.id },
      });
    }

    // support panel
    arr.push({
      id: "support",
      title: "Support Files",
      type: "support",
      top: 50,
      left: features.notesEnabled ? 75 : 60,
      width: features.notesEnabled ? 25 : 40,
      height: features.notesEnabled ? 50 : 100,
      visible: true,
      z: 170,
      component: SupportFilesPanel,
      componentProps: {},
    });

    // sandbox only if enabled
    if (features.sandboxEnabled) {
      arr.push({
        id: "sandbox",
        title: "Sandbox",
        type: "sandbox",
        top: 60,
        left: 15,
        width: 30,
        height: 40,
        visible: true,
        z: 150,
        component: SandboxPanel,
        componentProps: { language: features.sandboxLanguage || "javascript" },
      });
    }

    // set boxes (we don't override z for section)
    setBoxes(arr);
  }, [courseEntireData, courseSectionData, sectionId, subSectionId, courseId, auth]);

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

  // derive currentSub
  useEffect(() => {
    if (!courseSectionData || !courseSectionData.length) {
      setCurrentSub(null);
      return;
    }
    const sec = courseSectionData.find((s) => s._id === sectionId) || courseSectionData[0];
    const sub = (sec?.subSection || []).find((ss) => ss._id === subSectionId) || sec?.subSection?.[0] || null;
    setCurrentSub(sub);
  }, [courseSectionData, sectionId, subSectionId]);

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

    const box = boxes.find((b) => b.id === id);
    if (!box) return;

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
  }, [boxes, bringToFront]);

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
    const box = boxes.find((b) => b.id === id);
    if (!box) return;
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
  }, [boxes, bringToFront]);

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

  useEffect(() => {
    setBoxes((prev) => {
      return prev.map((b) => {
        if (b.id === "section") {
          return {
            ...b,
            component: SectionSidebar,
            componentProps: { course: courseEntireData, sections: courseSectionData, currentSectionId: sectionId, currentSubId: subSectionId },
          };
        }
        if (b.id === "notes") {
          return {
            ...b,
            component: NotesPanel,
            componentProps: { courseId, sectionId, subSectionId, userId: auth?.user?.id },
          };
        }
        if (b.id === "support") {
          return {
            ...b,
            component: SupportFilesPanel,
            componentProps: { supportMaterials: (currentSub && currentSub.supportMaterials) || [] },
          };
        }
        if (b.id === "sandbox") {
          return {
            ...b,
            component: SandboxPanel,
            componentProps: { language: (currentSub && currentSub.sandboxLanguage) || "javascript" },
          };
        }
        return b;
      });
    });

    if (!currentSub) return;

    const mats = currentSub.supportMaterials || [];
    const mainVideo = mats.find((m) => !!m.isMainVideo) || mats.find((m) => (m.resourceType || "").startsWith("video"));
    const mainPdf = mats.find((m) => !!m.isMainPdf) || mats.find((m) => (m.mimeType || "").toLowerCase() === "application/pdf");

    setBoxes((prev) => {
      const filtered = prev.filter((p) => !["player", "video", "pdf"].includes(p.id));

      if (mainVideo && mainPdf) {
        const videoBox = {
          id: "video",
          title: "Video",
          type: "video",
          top: 0,
          left: 15,
          width: 50,
          height: 60,
          visible: true,
          z: 200,
          component: ResourceViewer,
          componentProps: { resource: mainVideo, course: courseEntireData, token },
        };
        const pdfBox = {
          id: "pdf",
          title: "PDF",
          type: "pdf",
          top: 60,
          left: 15,
          width: 50,
          height: 40,
          visible: true,
          z: 190,
          component: ResourceViewer,
          componentProps: { resource: mainPdf, course: courseEntireData, token },
        };

        const sectionIndex = filtered.findIndex((p) => p.id === "section");
        if (sectionIndex === -1) {
          return [...filtered, videoBox, pdfBox];
        }
        const head = filtered.slice(0, sectionIndex + 1);
        const tail = filtered.slice(sectionIndex + 1);
        return [...head, videoBox, pdfBox, ...tail];
      }

      const first = mainVideo || mainPdf || mats[0] || null;
      const playerBox = {
        id: "player",
        title: "Player",
        type: "player",
        top: 0,
        left: 15,
        width: 60,
        height: 60,
        visible: true,
        z: 200,
        component: first ? (first.resourceType && first.resourceType.startsWith("video") ? PlayerPanel : ResourceViewer) : PlayerPanel,
        componentProps: first ? (first.resourceType && first.resourceType.startsWith("video") ? { sub: currentSub, course: courseEntireData, token } : { resource: first, course: courseEntireData, token }) : { sub: currentSub, course: courseEntireData, token },
      };

      const secIndex = filtered.findIndex((p) => p.id === "section");
      if (secIndex === -1) {
        return [playerBox, ...filtered];
      }
      const head = filtered.slice(0, secIndex + 1);
      const tail = filtered.slice(secIndex + 1);
      return [...head, playerBox, ...tail];
    });
  }, [currentSub, courseEntireData, courseSectionData, token, auth, courseId, sectionId, subSectionId]);

  return (
    <div className="w-screen h-screen bg-slate-900 text-white relative overflow-hidden">
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
            toggleBox={(id) => {
              setBoxes((prev) => prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)));
            }}
            onBringToFront={bringToFront}
          />
        ))}
      </div>
    </div>
  );
}
