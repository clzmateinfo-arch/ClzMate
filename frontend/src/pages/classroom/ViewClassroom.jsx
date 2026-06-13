import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Box from "../../shared/components/app/Box";
import TopicSidebar from "../../features/classroom/ui/View/TopicSidebar";
import ClassroomSectionSidebar from "../../features/classroom/ui/View/ClassroomSectionSidebar";
import AssignmentPanel from "../../features/classroom/ui/View/AssignmentPanel";
import MaterialPanel from "../../features/classroom/ui/View/MaterialPanel";
import QuizPanel from "../../features/classroom/ui/View/QuizPanel";
import AnnouncementPanel from "../../features/classroom/ui/View/AnnouncementPanel";
import { generateClassroomLayout } from "@/shared/utils/generateClassroomLayout";
import {
    listTopicsAPI,
    listAssignmentsByTopicAPI,
    listPublishedQuizzesByTopicAPI,
} from "@/entities/classroom/model/classroomAPI";
import Loading from "@/shared/components/navigation/Loading";
import { toast } from "react-hot-toast";

export default function ViewClassroom() {
    const { classroomId } = useParams();
    const navigate = useNavigate();
    const token = useSelector((s) => s.auth?.token);

    const [topics, setTopics] = useState([]);
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [loading, setLoading] = useState(false);
    const [boxes, setBoxes] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [features] = useState({ sandboxEnabled: false, notesEnabled: false });

    const dragState = useRef(null);
    const resizeState = useRef(null);

    useEffect(() => {
        if (!classroomId) return;
        let mounted = true;
        setLoading(true);
        listTopicsAPI(classroomId, token)
            .then((res) => {
                if (!mounted) return;
                const arr = Array.isArray(res) ? res : [];
                setTopics(arr);
                if (arr.length) setSelectedTopicId((id) => id || arr[0]._id);
                else setSelectedTopicId(null);
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
                const [aRes, qRes] = await Promise.allSettled([
                    listAssignmentsByTopicAPI(topicId, token).catch(() => []),
                    typeof listPublishedQuizzesByTopicAPI === "function"
                        ? listPublishedQuizzesByTopicAPI(topicId, token).catch(() => [])
                        : Promise.resolve([]),
                ]);
                const a = Array.isArray(aRes.value) ? aRes.value : aRes.value?.data ?? [];
                const q = Array.isArray(qRes.value) ? qRes.value : qRes.value?.data ?? [];
                setAssignments(a);
                setQuizzes(q);
            } catch (err) {
                console.warn("loadTopicExtras", err);
            }
        },
        [token]
    );

    useEffect(() => {
        loadTopicExtras(selectedTopicId);
    }, [selectedTopicId, loadTopicExtras]);

    const handleOpenSub = useCallback(
        (sub) => {
            if (!sub) return;

            if (sub.link && typeof sub.link === "string" && sub.link.trim()) {
                try {
                    if (sub.link.startsWith("/")) {
                        navigate(sub.link, { state: { fromClassroom: true, classroomId } });
                    } else {
                        window.open(sub.link, "_blank", "noopener");
                    }
                } catch {
                    try {
                        window.open(sub.link, "_blank", "noopener");
                    } catch (e) {
                        console.warn("failed to open subsection link", e);
                        toast.error("Unable to open subsection");
                    }
                }
                return;
            }

            if (sub.refCourseId && sub.refSectionId && sub.refId) {
                const url = `/view-course/${sub.refCourseId}/section/${sub.refSectionId}/sub-section/${sub.refId}`;
                try {
                    navigate(url, { state: { fromClassroom: true, classroomId } });
                } catch {
                    window.open(url, "_blank", "noopener");
                }
                return;
            }

            if (sub.refId) {
                const fallback1 = `/view-subsection/${sub.refId}`;
                try {
                    navigate(fallback1, { state: { fromClassroom: true, classroomId } });
                } catch {
                    window.open(fallback1, "_blank", "noopener");
                }
                return;
            }

            toast("No available link for this subsection", { icon: "ℹ️" });
        },
        [navigate, classroomId]
    );

    useEffect(() => {
        const materialsCount =
            selectedTopic && Array.isArray(selectedTopic.items)
                ? selectedTopic.items.filter((i) => i.type === "material").length
                : 0;

        const hasAssignments = assignments && assignments.length > 0;
        const hasQuizzes = quizzes && quizzes.length > 0;
        const hasMaterials = materialsCount > 0;
        const hasAnnouncements = announcements && announcements.length > 0;

        const panelsToShow = [];
        if (hasAssignments) panelsToShow.push("assignments");
        if (hasMaterials) panelsToShow.push("materials");
        if (hasQuizzes) panelsToShow.push("quizzes");
        if (hasAnnouncements) panelsToShow.push("announcements");

        const layout = generateClassroomLayout({
            features,
            hasExternal: false,
            hasPdf: false,
            hasVideo: false,
            sectionWidth: 16,
            panelsIncluded: panelsToShow,
        });

        const boxesMapped = layout.map((tile) => {
            if (tile.id === "announcements") {
                if (!hasAnnouncements) return { ...tile, visible: false, z: 100, component: () => null, componentProps: {} };
                return {
                    ...tile,
                    visible: true,
                    z: 275,
                    title: "Announcements",
                    component: AnnouncementPanel,
                    componentProps: { announcements },
                };
            }

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
                    component: ClassroomSectionSidebar,
                    componentProps: { topic: selectedTopic, onOpenSub: handleOpenSub },
                };
            }

            if (tile.id === "assignments") {
                if (!hasAssignments) return { ...tile, visible: false, z: 100, component: () => null, componentProps: {} };
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
                if (!hasMaterials) return { ...tile, visible: false, z: 100, component: () => null, componentProps: {} };
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
                if (!hasQuizzes) return { ...tile, visible: false, z: 280, component: () => null, componentProps: {} };
                return {
                    ...tile,
                    visible: true,
                    z: 280,
                    title: "Quizzes",
                    component: QuizPanel,
                    componentProps: { topicId: selectedTopicId, quizzes },
                };
            }

            return { ...tile, visible: false, z: 100, component: () => null, componentProps: {} };
        });

        setBoxes(boxesMapped);
    }, [selectedTopic, topics, assignments, quizzes, features, selectedTopicId, token, handleOpenSub, loadTopicExtras]);

    const bringToFront = useCallback((id) => {
        setBoxes((prev) => {
            const maxZ = prev.length ? Math.max(...prev.map((p) => p.z || 0)) : 100;
            return prev.map((p) => (p.id === id ? { ...p, z: maxZ + 1 } : p));
        });
    }, []);

    const onPointerDownDrag = useCallback(
        (e, id) => {
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
        },
        [bringToFront]
    );

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
        e?.preventDefault?.();
    }, []);

    const onPointerUpDrag = useCallback(() => {
        dragState.current = null;
        window.removeEventListener("mousemove", onPointerMoveDrag);
        window.removeEventListener("touchmove", onPointerMoveDrag);
        window.removeEventListener("mouseup", onPointerUpDrag);
        window.removeEventListener("touchend", onPointerUpDrag);
    }, [onPointerMoveDrag]);

    const onPointerDownResize = useCallback(
        (e, id) => {
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
        },
        [bringToFront]
    );

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
        // TODO: replace with real API call to fetch classroom announcements
        // Example:
        // listAnnouncementsAPI(classroomId, token).then(setAnnouncements).catch(() => setAnnouncements([]));
        setAnnouncements((prev) => prev || []); // keep present
    }, [classroomId, token]);

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
