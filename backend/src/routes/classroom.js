const express = require("express");
const router = express.Router();
const { auth, isInstructor } = require("../middleware/auth");
const classroomCtl = require("../controllers/classroom");
const classroomControllers = require("../controllers/classroomFeature");

router.post("/create", auth, isInstructor, classroomCtl.createClassroom);
router.get("/my", auth, classroomCtl.getMyClassrooms);
router.post("/join", auth, classroomCtl.joinByInviteCode);

router.post("/topics/:topicId/items/reorder", auth, classroomControllers.reorderItems);
router.post("/topics/:topicId/items", auth, classroomControllers.createItem);
router.patch("/topics/:topicId/items/:itemId/toggle", auth, classroomControllers.toggleItemStatus);
router.post("/topics/:topicId/items/:itemId/copy", auth, classroomControllers.copyItem);
router.patch("/topics/:topicId/items/:itemId", auth, classroomControllers.updateItem);
router.delete("/topics/:topicId/items/:itemId", auth, classroomControllers.deleteItem);

router.patch("/topics/:topicId", auth, classroomControllers.updateTopic);
router.delete("/topics/:topicId", auth, classroomControllers.deleteTopic);

router.post("/topics/:topicId/assignments", auth, classroomControllers.createAssignment);
router.get("/topics/:topicId/assignments/published", auth, classroomControllers.listPublishedAssignmentsByTopic);
router.get("/topics/:topicId/assignments", auth, classroomControllers.listAssignmentsByTopic);

router.get("/assignments/:assignmentId", auth, classroomControllers.getAssignment);
router.patch("/assignments/:assignmentId", auth, classroomControllers.updateAssignment);
router.delete("/assignments/:assignmentId", auth, classroomControllers.deleteAssignment);
router.post("/assignments/:assignmentId/submit", auth, classroomControllers.submitAssignment);
router.get("/assignments/:assignmentId/submission", auth, classroomControllers.getMySubmission);
router.get("/assignments/:assignmentId/submissions", auth, classroomControllers.getSubmissions);
router.patch("/assignments/:assignmentId/submissions/:submissionId", auth, classroomControllers.updateSubmission);

router.post("/topics/:topicId/quizzes", auth, classroomControllers.createQuiz);
router.get("/topics/:topicId/quizzes/published", auth, classroomControllers.listPublishedQuizzesByTopic);
router.get("/topics/:topicId/quizzes", auth, classroomControllers.listQuizzesByTopic);

router.patch("/quizzes/screens/:screenId", auth, classroomControllers.updateScreen);
router.get("/quizzes/:quizId", auth, classroomControllers.getQuiz);
router.patch("/quizzes/:quizId", auth, classroomControllers.updateQuiz);
router.delete("/quizzes/:quizId", auth, classroomControllers.deleteQuiz);
router.post("/quizzes/:quizId/screens/reorder", auth, classroomControllers.reorderScreens);
router.post("/quizzes/:quizId/screens", auth, classroomControllers.createScreen);
router.delete("/quizzes/:quizId/screens/:screenId", auth, classroomControllers.deleteScreen);
router.post("/quizzes/:quizId/attempts", auth, classroomControllers.submitAttempt);
router.get("/quizzes/:quizId/leaderboard", auth, classroomControllers.getLeaderboard);

router.get("/:id", auth, classroomCtl.getClassroom);
router.post("/:id/add-member", auth, classroomCtl.addMember);
router.post("/:id/remove-member", auth, classroomCtl.removeMember);

router.get("/:classroomId/overview", auth, classroomControllers.getClassOverview);
router.post("/:classroomId/announcements", auth, classroomControllers.createAnnouncement);
router.get("/:classroomId/announcements", auth, classroomControllers.listAnnouncements);
router.post("/:classroomId/topics/reorder", auth, classroomControllers.reorderTopics);
router.post("/:classroomId/topics", auth, classroomControllers.createTopic);
router.get("/:classroomId/topics", auth, classroomControllers.listTopics);

module.exports = router;
