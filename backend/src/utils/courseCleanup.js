const Section = require("../models/section");
const SubSection = require("../models/subSection");
const Course = require("../models/course");
const Category = require("../models/category");
const User = require("../models/user");
const CourseProgress = require("../models/courseProgress");
const Note = require("../models/note");
const RatingAndReview = require("../models/ratingAndReview");
const { deleteResourceFromCloudinary } = require("./fileUploader");

async function deleteSubSectionAssets(subSection) {
  for (const material of subSection.supportMaterials || []) {
    try {
      await deleteResourceFromCloudinary(material.publicId || material.url, material.resourceType);
    } catch (error) {
      console.error("Failed to delete support material:", error.message);
    }
  }
}

async function deleteSubSections(subSectionIds) {
  if (!subSectionIds.length) return;
  const subSections = await SubSection.find({ _id: { $in: subSectionIds } });
  for (const subSection of subSections) await deleteSubSectionAssets(subSection);
  await SubSection.deleteMany({ _id: { $in: subSectionIds } });
  await CourseProgress.updateMany(
    { completedVideos: { $in: subSectionIds } },
    { $pull: { completedVideos: { $in: subSectionIds } } }
  );
}

async function deleteSectionsWithContent(sectionIds) {
  if (!sectionIds.length) return;
  const sections = await Section.find({ _id: { $in: sectionIds } }).select("subSection");
  await deleteSubSections(sections.flatMap((section) => section.subSection));
  await Section.deleteMany({ _id: { $in: sectionIds } });
}

async function deleteCourseWithDependents(course) {
  const courseId = course._id;

  const progressDocs = await CourseProgress.find({ courseID: courseId }).select("_id");
  const progressIds = progressDocs.map((progress) => progress._id);

  await User.updateMany({ courses: courseId }, { $pull: { courses: courseId, courseProgress: { $in: progressIds } } });
  await User.updateMany({ cart: courseId }, { $pull: { cart: courseId } });
  await User.updateOne({ _id: course.instructor }, { $pull: { courses: courseId } });
  await Category.updateMany({ courses: courseId }, { $pull: { courses: courseId } });
  await CourseProgress.deleteMany({ courseID: courseId });
  await Note.deleteMany({ courseId });
  await RatingAndReview.deleteMany({ course: courseId });

  if (course.thumbnail) {
    try {
      await deleteResourceFromCloudinary(course.thumbnail);
    } catch (error) {
      console.error("Failed to delete course thumbnail:", error.message);
    }
  }

  await deleteSectionsWithContent(course.courseContent || []);
  await Course.deleteOne({ _id: courseId });
}

module.exports = { deleteSubSectionAssets, deleteSubSections, deleteSectionsWithContent, deleteCourseWithDependents };
