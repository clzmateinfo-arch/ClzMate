const Course = require("../models/course");

const isAdminUser = (req) => req.user?.accountType === "Admin";

const ownerIdOf = (course) => String(course.instructor?._id ?? course.instructor);

const canManageCourse = (req, course) => isAdminUser(req) || ownerIdOf(course) === String(req.user?.id);

async function findCourseForSection(sectionId) {
  return Course.findOne({ courseContent: sectionId }).select("instructor courseContent");
}

async function isEnrolledOrOwner(req, course) {
  if (canManageCourse(req, course)) return true;
  return (course.studentsEnrolled || []).some((studentId) => String(studentId) === String(req.user?.id));
}

module.exports = { isAdminUser, canManageCourse, findCourseForSection, isEnrolledOrOwner };
