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

router.post("/topics/:topicId/items", auth, isInstructor, classroomControllers.createItem);
router.patch("/topics/:topicId/items/:itemId", auth, isInstructor, classroomControllers.updateItem);
router.patch("/topics/:topicId/items/:itemId/toggle", auth, isInstructor, classroomControllers.toggleItemStatus);

router.post("/topics/:topicId/assignments", auth, isInstructor, classroomControllers.createAssignment);
router.get("/topics/:topicId/assignments", auth, classroomControllers.listAssignmentsByTopic);
router.get("/topics/:topicId/assignments/published", auth, classroomControllers.listPublishedAssignmentsByTopic);
router.get("/assignments/:assignmentId", auth, classroomControllers.getAssignment);
router.patch("/assignments/:assignmentId", auth, isInstructor, classroomControllers.updateAssignment);
router.post("/assignments/:assignmentId/submit", auth, classroomControllers.submitAssignment);
router.get("/assignments/:assignmentId/submission", auth, classroomControllers.getMySubmission);
router.get("/assignments/:assignmentId/submissions", auth, isInstructor, classroomControllers.getSubmissions);
router.patch("/assignments/:assignmentId/submissions/:submissionId", auth, isInstructor, classroomControllers.updateSubmission);

router.post("/topics/:topicId/quizzes", auth, isInstructor, classroomControllers.createQuiz);
router.get("/quizzes/:quizId", auth, classroomControllers.getQuiz);
router.get("/topics/:topicId/quizzes", auth, classroomControllers.listQuizzesByTopic);
router.get("/topics/:topicId/quizzes/published", auth, classroomControllers.listPublishedQuizzesByTopic);
router.patch("/quizzes/:quizId", auth, isInstructor, classroomControllers.updateQuiz);
router.delete("/quizzes/:quizId", auth, isInstructor, classroomControllers.deleteQuiz);
router.post("/quizzes/:quizId/screens", auth, isInstructor, classroomControllers.createScreen);
router.patch("/quizzes/screens/:screenId", auth, isInstructor, classroomControllers.updateScreen);
router.delete("/quizzes/:quizId/screens/:screenId", auth, isInstructor, classroomControllers.deleteScreen);
router.post("/quizzes/:quizId/screens/reorder", auth, isInstructor, classroomControllers.reorderScreens);
router.post("/quizzes/:quizId/attempts", auth, classroomControllers.submitAttempt);
router.get("/quizzes/:quizId/leaderboard", auth, classroomControllers.getLeaderboard);


module.exports = router;
