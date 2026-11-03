const Course = require("../models/course");
const Section = require("../models/section");
const { canManageCourse } = require("../utils/courseAccess");
const { deleteSectionsWithContent } = require("../utils/courseCleanup");
const { isObjectId, sendServerError } = require("../utils/validators");

const MAX_NAME_LENGTH = 200;

const populatedCourse = (courseId) =>
  Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } });

const isValidSectionName = (name) => typeof name === "string" && name.trim().length > 0 && name.length <= MAX_NAME_LENGTH;

async function resolveManagedCourse(req, res, courseId, sectionId) {
  const course = await Course.findById(courseId).select("instructor courseContent");
  if (!course) {
    res.status(404).json({ success: false, message: "Course not found" });
    return null;
  }
  if (!canManageCourse(req, course)) {
    res.status(403).json({ success: false, message: "Forbidden: you do not own this course" });
    return null;
  }
  if (sectionId && !course.courseContent.some((id) => String(id) === String(sectionId))) {
    res.status(404).json({ success: false, message: "Section not found in this course" });
    return null;
  }
  return course;
}

exports.createSection = async (req, res) => {
  try {
    const { sectionName, courseId } = req.body || {};

    if (!isValidSectionName(sectionName) || !courseId) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (!isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }

    const course = await resolveManagedCourse(req, res, courseId);
    if (!course) return;

    const newSection = await Section.create({ sectionName: sectionName.trim() });
    await Course.updateOne({ _id: courseId }, { $push: { courseContent: newSection._id } });

    return res.status(200).json({
      success: true,
      updatedCourseDetails: await populatedCourse(courseId),
      message: "Section created successfully",
    });
  } catch (error) {
    return sendServerError(res, "Error while creating section", error, "Error while creating section");
  }
};

exports.updateSection = async (req, res) => {
  try {
    const { sectionName, sectionId, courseId } = req.body || {};

    if (!sectionId || !courseId || !isValidSectionName(sectionName)) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (!isObjectId(sectionId) || !isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const course = await resolveManagedCourse(req, res, courseId, sectionId);
    if (!course) return;

    await Section.updateOne({ _id: sectionId }, { sectionName: sectionName.trim() });

    return res.status(200).json({
      success: true,
      data: await populatedCourse(courseId),
      message: "Section updated successfully",
    });
  } catch (error) {
    return sendServerError(res, "Error while updating section", error, "Error while updating section");
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body || {};

    if (!sectionId || !courseId) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (!isObjectId(sectionId) || !isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const course = await resolveManagedCourse(req, res, courseId, sectionId);
    if (!course) return;

    await Course.updateOne({ _id: courseId }, { $pull: { courseContent: sectionId } });
    await deleteSectionsWithContent([sectionId]);

    return res.status(200).json({
      success: true,
      data: await populatedCourse(courseId),
      message: "Section deleted successfully",
    });
  } catch (error) {
    return sendServerError(res, "Error while deleting section", error, "Error while deleting section");
  }
};
