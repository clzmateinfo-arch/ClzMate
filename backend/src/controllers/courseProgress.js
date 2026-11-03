const Course = require("../models/course");
const Section = require("../models/section");
const CourseProgress = require("../models/courseProgress");
const { isObjectId, sendServerError } = require("../utils/validators");

exports.updateCourseProgress = async (req, res) => {
  try {
    const { courseId, subSectionId } = req.body || {};
    const userId = req.user.id;

    if (!isObjectId(courseId) || !isObjectId(subSectionId)) {
      return res.status(400).json({ success: false, message: "Valid courseId and subSectionId are required" });
    }

    const section = await Section.findOne({ subSection: subSectionId }).select("_id");
    const course = section && (await Course.findOne({ _id: courseId, courseContent: section._id, studentsEnrolled: userId }).select("_id"));
    if (!course) {
      return res.status(404).json({ success: false, message: "Invalid subsection" });
    }

    const courseProgress = await CourseProgress.findOne({ courseID: courseId, userId });
    if (!courseProgress) {
      return res.status(404).json({ success: false, message: "Course progress Does Not Exist" });
    }

    const update = await CourseProgress.updateOne(
      { _id: courseProgress._id, completedVideos: { $ne: subSectionId } },
      { $addToSet: { completedVideos: subSectionId } }
    );
    if (update.modifiedCount === 0) {
      return res.status(400).json({ success: false, message: "Subsection already completed" });
    }

    return res.status(200).json({ success: true, message: "Course progress updated" });
  } catch (error) {
    return sendServerError(res, "updateCourseProgress error", error, "Internal server error");
  }
};
