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
router.post("/topics/:topicId/assignments", auth, isInstructor, classroomControllers.createAssignment);
router.get("/topics/:topicId/assignments", auth, classroomControllers.listAssignmentsByTopic);
router.post("/assignments/:assignmentId/submit", auth, classroomControllers.submitAssignment);
router.get("/assignments/:assignmentId/submissions", auth, isInstructor, classroomControllers.getSubmissions);

module.exports = router;
