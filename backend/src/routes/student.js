const express = require("express");
const router = express.Router();
const { getStudentDashboard } = require("../controllers/student");
const { auth } = require("../middleware/auth");

router.get("/dashboard", auth, getStudentDashboard);

module.exports = router;
