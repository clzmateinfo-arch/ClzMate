const Course = require("../models/course");
const CourseProgress = require("../models/courseProgress");
const Note = require("../models/note");
const Profile = require("../models/profile");
const RatingAndReview = require("../models/ratingAndReview");
const User = require("../models/user");
const { deleteResourceFromCloudinary } = require("./fileUploader");
const { deleteCourseWithDependents } = require("./courseCleanup");

async function hasPublishedCoursesWithStudents(userId) {
  return !!(await Course.exists({ instructor: userId, status: "Published", "studentsEnrolled.0": { $exists: true } }));
}

async function removeUserReviews(userId) {
  const reviews = await RatingAndReview.find({ user: userId }).select("_id course");
  if (!reviews.length) return;
  for (const review of reviews) {
    await Course.updateOne({ _id: review.course }, { $pull: { ratingAndReviews: review._id } });
  }
  await RatingAndReview.deleteMany({ user: userId });
}

async function deleteUserWithData(user) {
  const userId = user._id;

  if (user.accountType === "Instructor" && (await hasPublishedCoursesWithStudents(userId))) {
    return { deleted: false, reason: "Instructor still owns published courses with enrolled students" };
  }

  if (user.image) {
    try {
      await deleteResourceFromCloudinary(user.image);
    } catch (error) {
      console.error("Failed to delete profile image:", error.message);
    }
  }

  const ownedCourses = await Course.find({ instructor: userId });
  for (const course of ownedCourses) await deleteCourseWithDependents(course);

  await Course.updateMany(
    { $or: [{ studentsEnrolled: userId }, { "enrollmentRequests.user": userId }] },
    { $pull: { studentsEnrolled: userId, enrollmentRequests: { user: userId } } }
  );
  await CourseProgress.deleteMany({ userId });
  await Note.deleteMany({ userId });
  await removeUserReviews(userId);

  if (user.additionalDetails) await Profile.deleteOne({ _id: user.additionalDetails });
  await User.deleteOne({ _id: userId });

  return { deleted: true };
}

module.exports = { deleteUserWithData };
