// backend/src/routes/student.js
const express = require("express");
const router = express.Router();
const { getStudentDashboard } = require("../controllers/student");
const { auth } = require("../middleware/auth");

// GET student dashboard
router.get("/dashboard", auth, getStudentDashboard);

module.exports = router;
