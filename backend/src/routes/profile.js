const express = require("express");
const router = express.Router();
const { auth, isInstructor } = require("../middleware/auth");
const {
    updateProfile,
    updateUserProfileImage,
    getUserDetails,
    getEnrolledCourses,
    deleteAccount,
    instructorDashboard,
    getPublicProfile,
} = require("../controllers/profile");

router.get("/public/:id", getPublicProfile);
router.delete("/deleteProfile", auth, deleteAccount);
router.put("/updateProfile", auth, updateProfile);
router.get("/getUserDetails", auth, getUserDetails);
router.get("/getEnrolledCourses", auth, getEnrolledCourses);
router.put("/updateUserProfileImage", auth, updateUserProfileImage);
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard);

module.exports = router;
