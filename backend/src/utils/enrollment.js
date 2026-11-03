const Course = require("../models/course");
const CourseProgress = require("../models/courseProgress");
const User = require("../models/user");
const mailSender = require("./mailSender");
const { escapeHtml } = require("./validators");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");

async function notifyInstructorOfRequest(course) {
  try {
    const instructor = await User.findById(course.instructor).select("email");
    if (!instructor) return;
    await mailSender(
      instructor.email,
      `Enrollment request for ${course.courseName}`,
      `A student has requested enrollment in ${escapeHtml(course.courseName)}. Please review in the instructor dashboard.`
    );
  } catch (error) {
    console.error("Failed to notify instructor about enrollment request:", error.message);
  }
}

async function createEnrollmentRequest(course, userId) {
  const existing = (course.enrollmentRequests || []).find((request) => String(request.user) === String(userId));
  if (existing && existing.status === "Pending") return { status: "pending", isNew: false };

  if (existing) {
    existing.status = "Pending";
    existing.requestedAt = Date.now();
    existing.respondedAt = null;
    existing.responder = null;
    existing.note = "";
  } else {
    course.enrollmentRequests.push({ user: userId, status: "Pending", requestedAt: Date.now() });
  }
  await course.save();
  await notifyInstructorOfRequest(course);
  return { status: "pending", isNew: true };
}

async function completeEnrollment(courseId, userId) {
  const claim = await Course.updateOne(
    { _id: courseId, studentsEnrolled: { $ne: userId } },
    { $addToSet: { studentsEnrolled: userId } }
  );
  if (claim.modifiedCount === 0) return { enrolled: false };

  const progress = await CourseProgress.findOneAndUpdate(
    { courseID: courseId, userId },
    { $setOnInsert: { completedVideos: [] } },
    { upsert: true, new: true }
  );
  const student = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { courses: courseId, courseProgress: progress._id } },
    { new: true }
  );

  try {
    const course = await Course.findById(courseId).select("courseName");
    if (student && course) {
      await mailSender(
        student.email,
        `Successfully Enrolled into ${course.courseName}`,
        courseEnrollmentEmail(escapeHtml(course.courseName), escapeHtml(student.firstName))
      );
    }
  } catch (error) {
    console.error("Failed to send enrollment email:", error.message);
  }
  return { enrolled: true };
}

async function enrollStudentInCourses(courseIds, userId) {
  const results = [];
  for (const courseId of courseIds) {
    try {
      const course = await Course.findOne({ _id: courseId, status: "Published" });
      if (!course) {
        results.push({ courseId, success: false, message: "Course not found" });
        continue;
      }
      if (course.studentsEnrolled.some((studentId) => String(studentId) === String(userId))) {
        results.push({ courseId, success: false, status: "already-enrolled", message: "Student already enrolled" });
        continue;
      }
      if (course.requiresApproval) {
        await createEnrollmentRequest(course, userId);
        results.push({ courseId, success: true, status: "pending", message: "Enrollment pending instructor approval" });
        continue;
      }
      const { enrolled } = await completeEnrollment(courseId, userId);
      results.push(
        enrolled
          ? { courseId, success: true, status: "enrolled", message: "Enrolled successfully" }
          : { courseId, success: false, status: "already-enrolled", message: "Student already enrolled" }
      );
    } catch (error) {
      console.error("enrollStudentInCourses error", error);
      results.push({ courseId, success: false, message: "Enrollment failed" });
    }
  }
  return results;
}

module.exports = { enrollStudentInCourses, completeEnrollment, createEnrollmentRequest };
