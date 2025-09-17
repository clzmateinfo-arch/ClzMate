const express = require("express");
const router = express.Router();
const {
    createCourse,
    getCourseDetails,
    getAllCourses,
    getFullCourseDetails,
    editCourse,
    deleteCourse,
    getInstructorCourses,
} = require("../controllers/course");
const { updateCourseProgress } = require("../controllers/courseProgress");
const {
    createCategory,
    showAllCategories,
    getCategoryPageDetails,
} = require("../controllers/category");
const {
    createSection,
    updateSection,
    deleteSection,
} = require("../controllers/section");
const {
    createSubSection,
    updateSubSection,
    deleteSubSection,
} = require("../controllers/subSection");
const {
    createRating,
    getAverageRating,
    getAllRatingReview,
} = require("../controllers/ratingAndReview");
const {
    auth,
    isAdmin,
    isInstructor,
    isStudent,
} = require("../middleware/auth");
const { getAssetUrl } = require("../controllers/asset");

router.post("/createCourse", auth, isInstructor, createCourse);
router.post("/addSection", auth, isInstructor, createSection);
router.post("/updateSection", auth, isInstructor, updateSection);
router.post("/deleteSection", auth, isInstructor, deleteSection);
router.post("/addSubSection", auth, isInstructor, createSubSection);
router.post("/updateSubSection", auth, isInstructor, updateSubSection);
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);
router.get("/getAllCourses", getAllCourses);
router.post("/getCourseDetails", getCourseDetails);
router.post("/getFullCourseDetails", auth, getFullCourseDetails);
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses);
router.post("/editCourse", auth, isInstructor, editCourse);
router.delete("/deleteCourse", auth, isInstructor, deleteCourse);
router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);
router.post("/createCategory", auth, isAdmin, createCategory);
router.get("/showAllCategories", showAllCategories);
router.post("/getCategoryPageDetails", getCategoryPageDetails);
router.post("/createRating", auth, isStudent, createRating);
router.get("/getAverageRating", getAverageRating);
router.get("/getReviews", getAllRatingReview);
router.post("/getAssetUrl", auth, getAssetUrl);

module.exports = router;
