const express = require("express");
const router = express.Router();
const { auth, isInstructor, isAdmin } = require("../middleware/auth");
const classroomCtl = require("../controllers/classroom");

router.post("/create", auth, isInstructor, classroomCtl.createClassroom);
router.get("/my", auth, classroomCtl.getMyClassrooms);
router.get("/:id", auth, classroomCtl.getClassroom);
router.post("/join", auth, classroomCtl.joinByInviteCode);
router.post("/:id/add-member", auth, classroomCtl.addMember);
router.post("/:id/remove-member", auth, classroomCtl.removeMember);

module.exports = router;
