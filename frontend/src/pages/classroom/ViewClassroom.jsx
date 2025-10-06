import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Box from "../../shared/components/app/Box";
import { generateClassroomLayout } from "@/shared/utils/generateClassroomLayout";
import TopicSidebar from "../../shared/components/app/TopicSidebar";
import SectionSidebar from "../../shared/components/app/SectionSidebar";
import AssignmentPanel from "../../shared/components/app/AssignmentPanel";
import MaterialPanel from "../../shared/components/app/MaterialPanel";
import QuizPanel from "../../shared/components/app/QuizPanel";
import SupportFilesPanel from "../../shared/components/app/SupportFilesPanel";
import NotePanel from "../../shared/components/app/NotePanel";
import SandboxPanel from "../../shared/components/app/SandboxPanel";
import ExternalVideo from "../../shared/components/app/ExternalVideo";
import ResourceViewer from "../../shared/components/app/ResourceViewer";
import {
    listTopicsAPI,
    listAssignmentsByTopicAPI,
    listQuizzesByTopicAPI,
} from "@/entities/classroom/model/classroomAPI";
import Loading from "@/shared/components/navigation/Loading";
import { toast } from "react-hot-toast";

export default function ViewClassroom() {
    const { classroomId } = useParams();
    const token = useSelector((s) => s.auth?.token);
    const [topics, setTopics] = useState([]);
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [loading, setLoading] = useState(false);
    const [boxes, setBoxes] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [features] = useState({ sandboxEnabled: false, notesEnabled: true });
    const dragState = useRef(null);
    const resizeState = useRef(null);

    useEffect(() => {
        if (!classroomId) return;
        let mounted = true;
        setLoading(true);
        listTopicsAPI(classroomId, token)
            .then((res) => {
                if (!mounted) return;
                setTopics(Array.isArray(res) ? res : []);
                if (Array.isArray(res) && res.length) {
                    setSelectedTopicId((id) => id || res[0]._id);
                }
            })
            .catch((err) => {
                console.error("Failed to load topics", err);
                toast.error("Failed to load topics");
            })
            .finally(() => mounted && setLoading(false));
        return () => (mounted = false);
    }, [classroomId, token]);

    useEffect(() => {
        const t = topics.find((x) => String(x._id) === String(selectedTopicId));
        setSelectedTopic(t || null);
    }, [topics, selectedTopicId]);

    const loadTopicExtras = useCallback(
        async (topicId) => {
            if (!topicId) {
                setAssignments([]);
                setQuizzes([]);
                return;
            }
            try {
                const [a, q] = await Promise.allSettled([
                    listAssignmentsByTopicAPI(topicId, token).catch(() => []),
                    typeof listQuizzesByTopicAPI === "function"
                        ? listQuizzesByTopicAPI(topicId, token).catch(() => [])
                        : Promise.resolve([]),
                ]);
                setAssignments(Array.isArray(a.value) ? a.value : a.value?.data ?? []);
                setQuizzes(Array.isArray(q.value) ? q.value : q.value?.data ?? []);
            } catch (err) {
                console.warn("loadTopicExtras", err);
            }
        },
        [token]
    );

    useEffect(() => {
        loadTopicExtras(selectedTopicId);
    }, [selectedTopicId, loadTopicExtras]);

    useEffect(() => {
        const hasExternal = !!(selectedTopic && selectedTopic.items && selectedTopic.items.find((it) => it.type === "subsection" && it.link));
        const hasPdf = !!(selectedTopic && selectedTopic.items && selectedTopic.items.find((it) => it.attachments && it.attachments.find((a) => (a.mimeType || "").toLowerCase() === "application/pdf")));
        const hasVideo = !!(selectedTopic && selectedTopic.items && selectedTopic.items.find((it) => it.attachments && it.attachments.find((a) => (a.resourceType || "").startsWith("video"))));
        const layout = generateClassroomLayout({ features, hasExternal, hasPdf, hasVideo, sectionWidth: 16 });

        const boxesMapped = layout.map((tile) => {
            if (tile.id === "topics") {
                return {
                    ...tile,
                    visible: true,
                    z: 400,
                    title: "Topics",
                    component: TopicSidebar,
                    componentProps: { topics, selectedTopicId, onSelect: setSelectedTopicId },
                };
            }
            if (tile.id === "sections") {
                return {
                    ...tile,
                    visible: true,
                    z: 350,
                    title: "Sections",
                    component: SectionSidebar,
                    componentProps: { topic: selectedTopic, onOpenSub: () => { } },
                };
            }
            if (tile.id === "assignments") {
                return {
                    ...tile,
                    visible: true,
                    z: 300,
                    title: "Assignments",
                    component: AssignmentPanel,
                    componentProps: { topicId: selectedTopicId, assignments, refresh: () => loadTopicExtras(selectedTopicId) },
                };
            }
            if (tile.id === "materials") {
                return {
                    ...tile,
                    visible: true,
                    z: 290,
                    title: "Materials",
                    component: MaterialPanel,
                    componentProps: { topic: selectedTopic, token },
                };
            }
            if (tile.id === "quizzes") {
                return {
                    ...tile,
                    visible: true,
                    z: 280,
                    title: "Quizzes",
                    component: QuizPanel,
                    componentProps: { topicId: selectedTopicId, quizzes },
                };
            }
            if (tile.id === "attachments") {
                return {
                    ...tile,
                    visible: true,
                    z: 270,
                    title: "Attachments",
                    component: SupportFilesPanel,
                    componentProps: { supportMaterials: (selectedTopic?.items || []).flatMap((it) => it.attachments || []) },
                };
            }
            if (tile.id === "external") {
                return {
                    ...tile,
                    visible: true,
                    z: 260,
                    title: "External",
                    component: ExternalVideo,
                    componentProps: { url: (selectedTopic?.items || []).find((i) => i.type === "subsection")?.link || null },
                };
            }
            if (tile.id === "video" || tile.id === "pdf") {
                const firstAttachment = (selectedTopic?.items || []).flatMap((it) => it.attachments || [])[0] || null;
                return {
                    ...tile,
                    visible: true,
                    z: 240,
                    title: tile.id === "video" ? "Primary Video" : "Primary Document",
                    component: ResourceViewer,
                    componentProps: { resource: firstAttachment, token },
                };
            }
            if (tile.id === "notes") {
                return {
                    ...tile,
                    visible: true,
                    z: 200,
                    title: "Notes",
                    component: NotePanel,
                    componentProps: { classroomId, topicId: selectedTopicId },
                };
            }
            if (tile.id === "sandbox") {
                return {
                    ...tile,
                    visible: true,
                    z: 150,
                    title: "Sandbox",
                    component: SandboxPanel,
                    componentProps: { language: "javascript" },
                };
            }

            return { ...tile, visible: false, z: 100, component: () => null, componentProps: {} };
        });

        setBoxes(boxesMapped);
    }, [selectedTopic, topics, assignments, quizzes, features, classroomId, token, loadTopicExtras]);

    const bringToFront = useCallback((id) => {
        setBoxes((prev) => {
            const maxZ = prev.length ? Math.max(...prev.map((p) => p.z || 0)) : 100;
            return prev.map((p) => (p.id === id ? { ...p, z: maxZ + 1 } : p));
        });
    }, []);

    const onPointerDownDrag = useCallback((e, id) => {
        const clientX = e.clientX ?? (e.touches?.[0]?.clientX);
        const clientY = e.clientY ?? (e.touches?.[0]?.clientY);
        bringToFront(id);
        setBoxes((prev) => {
            const box = prev.find((b) => b.id === id);
            if (!box) return prev;
            dragState.current = { id, startX: clientX, startY: clientY, startLeft: box.left, startTop: box.top };
            window.addEventListener("mousemove", onPointerMoveDrag);
            window.addEventListener("touchmove", onPointerMoveDrag, { passive: false });
            window.addEventListener("mouseup", onPointerUpDrag);
            window.addEventListener("touchend", onPointerUpDrag);
            return prev;
        });
    }, [bringToFront]);

    const onPointerMoveDrag = useCallback((e) => {
        if (!dragState.current) return;
        const clientX = e.clientX ?? (e.touches?.[0]?.clientX);
        const clientY = e.clientY ?? (e.touches?.[0]?.clientY);
        const { id, startX, startY, startLeft, startTop } = dragState.current;
        const dx = clientX - startX;
        const dy = clientY - startY;
        const vw = window.innerWidth || document.documentElement.clientWidth;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const newLeft = Math.max(0, Math.min(100, startLeft + (dx / vw) * 100));
        const newTop = Math.max(0, Math.min(100, startTop + (dy / vh) * 100));
        setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, left: newLeft, top: newTop } : b)));
        e.preventDefault?.();
    }, []);

    const onPointerUpDrag = useCallback(() => {
        dragState.current = null;
        window.removeEventListener("mousemove", onPointerMoveDrag);
        window.removeEventListener("touchmove", onPointerMoveDrag);
        window.removeEventListener("mouseup", onPointerUpDrag);
        window.removeEventListener("touchend", onPointerUpDrag);
    }, [onPointerMoveDrag]);

    const onPointerDownResize = useCallback((e, id) => {
        const clientX = e.clientX ?? (e.touches?.[0]?.clientX);
        const clientY = e.clientY ?? (e.touches?.[0]?.clientY);
        bringToFront(id);
        setBoxes((prev) => {
            const box = prev.find((b) => b.id === id);
            if (!box) return prev;
            resizeState.current = { id, startX: clientX, startY: clientY, startW: box.width, startH: box.height };
            window.addEventListener("mousemove", onPointerMoveResize);
            window.addEventListener("touchmove", onPointerMoveResize, { passive: false });
            window.addEventListener("mouseup", onPointerUpResize);
            window.addEventListener("touchend", onPointerUpResize);
            return prev;
        });
    }, [bringToFront]);

    const onPointerMoveResize = useCallback((e) => {
        if (!resizeState.current) return;
        const clientX = e.clientX ?? (e.touches?.[0]?.clientX);
        const clientY = e.clientY ?? (e.touches?.[0]?.clientY);
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
        e.preventDefault?.();
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

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-slate-50 text-black relative overflow-hidden">
            <div className="w-full h-full relative bg-white">
                {boxes.map((b) => (
                    <Box
                        key={b.id}
                        box={b}
                        component={b.component}
                        componentProps={{
                            ...(b.componentProps || {}),
                            classroomId,
                            topic: selectedTopic,
                            topics,
                        }}
                        onPointerDownDrag={onPointerDownDrag}
                        onPointerDownResize={onPointerDownResize}
                        toggleBox={() => setBoxes((prev) => prev.map((x) => (x.id === b.id ? { ...x, visible: !x.visible } : x)))}
                        onBringToFront={bringToFront}
                    />
                ))}
            </div>
        </div>
    );
}
