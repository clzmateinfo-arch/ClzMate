const express = require("express");
const router = express.Router();
const { auth, isInstructor, isAdmin } = require("../middleware/auth");
const classroomCtl = require("../controllers/classroom");
const classroomControllers = require("../controllers/classroomFeature");

router.post("/create", auth, isInstructor, classroomCtl.createClassroom);
router.get("/my", auth, classroomCtl.getMyClassrooms);
router.get("/:id", auth, classroomCtl.getClassroom);
router.post("/join", auth, classroomCtl.joinByInviteCode);
router.post("/:id/add-member", auth, classroomCtl.addMember);
router.post("/:id/remove-member", auth, classroomCtl.removeMember);

router.get("/:classroomId/overview", auth, classroomControllers.getClassOverview);
router.post("/:classroomId/announcements", auth, isInstructor, classroomControllers.createAnnouncement);
router.get("/:classroomId/announcements", auth, classroomControllers.listAnnouncements);

router.post("/:classroomId/topics", auth, isInstructor, classroomControllers.createTopic);
router.get("/:classroomId/topics", auth, classroomControllers.listTopics);
router.patch("/topics/:topicId", auth, isInstructor, classroomControllers.updateTopic);
router.delete("/topics/:topicId", auth, isInstructor, classroomControllers.deleteTopic);
router.post("/:classroomId/topics/reorder", auth, isInstructor, classroomControllers.reorderTopics);

router.post("/topics/:topicId/assignments", auth, isInstructor, classroomControllers.createAssignment);
router.get("/topics/:topicId/assignments", auth, classroomControllers.listAssignmentsByTopic);
router.get("/assignments/:assignmentId", auth, classroomControllers.getAssignment);
router.patch("/assignments/:assignmentId", auth, isInstructor, classroomControllers.updateAssignment);

router.post("/topics/:topicId/quizzes", auth, isInstructor, classroomControllers.createQuiz);
router.get("/quizzes/:quizId", auth, classroomControllers.getQuiz);
router.patch("/quizzes/:quizId", auth, isInstructor, classroomControllers.updateQuiz);

router.post("/quizzes/:quizId/screens", auth, isInstructor, classroomControllers.createScreen);
router.patch("/quizzes/screens/:screenId", auth, isInstructor, classroomControllers.updateScreen);
router.delete("/quizzes/:quizId/screens/:screenId", auth, isInstructor, classroomControllers.deleteScreen);
router.post("/quizzes/:quizId/screens/reorder", auth, isInstructor, classroomControllers.reorderScreens);


module.exports = router;
