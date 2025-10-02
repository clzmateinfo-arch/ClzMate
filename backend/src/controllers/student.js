// backend/src/controllers/student.js
const Course = require("../models/course");
const CourseProgress = require("../models/courseProgress");
const User = require("../models/user");
const { convertSecondsToDuration } = require("../utils/secToDuration"); // optional if needed

/**
 * GET /student/dashboard
 * Returns: { success: true, data: { studentData: {...}, courses: [...] } }
 *
 * For each enrolled course we return:
 *  - _id, courseName, thumbnail, instructorName, progress (0-100), studentsEnrolled (array)
 *
 * studentData includes: totalSpent (sum of course.price for enrolled courses where price>0), certificates (derived from completed courses)
 */
exports.getStudentDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        // Load user (optional   useful if you store payments)
        const user = await User.findById(userId).lean();

        // Find all courses where the student is enrolled
        let enrolledCourses = await Course.find({ studentsEnrolled: userId })
            .populate({
                path: "courseContent",
                populate: { path: "subSection", select: "timeDuration" },
            })
            .populate({ path: "instructor", select: "firstName lastName" })
            .lean();

        if (!Array.isArray(enrolledCourses)) enrolledCourses = [];

        // Build course list with progress, instructorName etc.
        const coursesWithProgress = [];

        for (const course of enrolledCourses) {
            // Count total subsections in the course
            let totalSubsections = 0;
            if (Array.isArray(course.courseContent)) {
                for (const section of course.courseContent) {
                    if (Array.isArray(section.subSection)) {
                        totalSubsections += section.subSection.length;
                    }
                }
            }

            // Get the student's course progress document
            const cp = await CourseProgress.findOne({ courseID: course._id, userId }).lean();
            const completedCount = cp ? (Array.isArray(cp.completedVideos) ? cp.completedVideos.length : 0) : 0;

            const progress = totalSubsections > 0 ? Math.round((completedCount / totalSubsections) * 100) : (cp ? 100 : 0);

            // instructor name fallback
            const instructorName = course.instructor ? `${course.instructor.firstName || ""} ${course.instructor.lastName || ""}`.trim() : "Instructor";

            coursesWithProgress.push({
                _id: course._id,
                courseName: course.courseName,
                thumbnail: course.thumbnail,
                instructorName,
                progress,
                studentsEnrolled: Array.isArray(course.studentsEnrolled) ? course.studentsEnrolled : [],
                price: course.price ?? 0,
            });
        }

        // totalSpent: best-effort: sum of course.price for enrolled courses (if price field exists)
        const totalSpent = coursesWithProgress.reduce((s, c) => s + (Number(c.price) || 0), 0);

        // certificates: count of courses where progress >= 100
        const certificates = coursesWithProgress.filter((c) => Number(c.progress) >= 100).length;

        const studentData = {
            totalSpent,
            certificates,
            // add other fields if you want, e.g., user name, email etc:
            user: {
                _id: user?._id,
                firstName: user?.firstName,
                lastName: user?.lastName,
                email: user?.email,
            },
        };

        return res.status(200).json({
            success: true,
            data: { studentData, courses: coursesWithProgress },
        });
    } catch (err) {
        console.error("getStudentDashboard error", err);
        return res.status(500).json({ success: false, message: err.message || "Failed to get dashboard" });
    }
};
