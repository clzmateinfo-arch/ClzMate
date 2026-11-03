const Course = require("../models/course");
const CourseProgress = require("../models/courseProgress");
const User = require("../models/user");
const mailSender = require("./mailSender");
const { enrollmentConfirmedEmail, enrollmentRequestInstructorEmail, enrollmentRequestStudentEmail } = require("../mail/templates");

const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.preferredName || "";
const greetingName = (user) => user?.preferredName || user?.firstName || "";

async function notifyEnrollmentRequest(course, userId) {
  try {
    const [instructor, student] = await Promise.all([
      User.findById(course.instructor).select("email firstName lastName preferredName"),
      User.findById(userId).select("email firstName lastName preferredName"),
    ]);
    if (instructor) {
      await mailSender.sendTemplate(
        instructor.email,
        enrollmentRequestInstructorEmail({
          instructorName: greetingName(instructor),
          studentName: fullName(student),
          studentEmail: student?.email,
          courseName: course.courseName,
          courseId: String(course._id),
        })
      );
    }
    if (student) {
      await mailSender.sendTemplate(
        student.email,
        enrollmentRequestStudentEmail({ name: greetingName(student), courseName: course.courseName, instructorName: fullName(instructor) })
      );
    }
  } catch (error) {
    console.error("Failed to send enrollment request emails:", error.message);
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
  await notifyEnrollmentRequest(course, userId);
  return { status: "pending", isNew: true };
}

async function completeEnrollment(courseId, userId, { reason = "free" } = {}) {
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
    const course = await Course.findById(courseId)
      .select("courseName instructor")
      .populate({ path: "instructor", select: "firstName lastName preferredName" });
    if (student && course) {
      await mailSender.sendTemplate(
        student.email,
        enrollmentConfirmedEmail({
          name: greetingName(student),
          courseName: course.courseName,
          instructorName: fullName(course.instructor),
          reason,
        })
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
      const { enrolled } = await completeEnrollment(courseId, userId, { reason: Number(course.price) > 0 ? "payment" : "free" });
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
