const Course = require("../models/course");
const CourseProgress = require("../models/courseProgress");
const User = require("../models/user");
const { convertSecondsToDuration } = require("../utils/secToDuration");

exports.getStudentDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).lean();

        let enrolledCourses = await Course.find({ studentsEnrolled: userId })
            .populate({
                path: "courseContent",
                populate: { path: "subSection", select: "timeDuration" },
            })
            .populate({ path: "instructor", select: "firstName lastName" })
            .lean();

        if (!Array.isArray(enrolledCourses)) enrolledCourses = [];

        const coursesWithProgress = [];

        for (const course of enrolledCourses) {
            let totalSubsections = 0;
            if (Array.isArray(course.courseContent)) {
                for (const section of course.courseContent) {
                    if (Array.isArray(section.subSection)) {
                        totalSubsections += section.subSection.length;
                    }
                }
            }

            const cp = await CourseProgress.findOne({ courseID: course._id, userId }).lean();
            const completedCount = cp ? (Array.isArray(cp.completedVideos) ? cp.completedVideos.length : 0) : 0;

            const progress = totalSubsections > 0 ? Math.round((completedCount / totalSubsections) * 100) : (cp ? 100 : 0);

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

        const totalSpent = coursesWithProgress.reduce((s, c) => s + (Number(c.price) || 0), 0);

        const certificates = coursesWithProgress.filter((c) => Number(c.progress) >= 100).length;

        const studentData = {
            totalSpent,
            certificates,
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
