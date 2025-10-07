// backend/src/controllers/stats.js
const User = require("../models/User");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");

async function safeCount(model, query = {}) {
    try {
        return await model.countDocuments(query);
    } catch (e) {
        console.warn("safeCount error:", e.message);
        return 0;
    }
}

exports.getSiteStats = async (req, res) => {
    try {
        const totalStudents = await safeCount(User, { accountType: "Student" });
        const mentors = await safeCount(User, { accountType: "Instructor" });

        const courses = await safeCount(Course, {});

        const allCourses = await Course.find({}, { courseContent: 1 }).populate({
            path: "courseContent",
            select: "subSection",
        }).lean();

        const courseSubsectionCount = {};
        for (const c of allCourses) {
            let total = 0;
            if (Array.isArray(c.courseContent)) {
                for (const s of c.courseContent) {
                    if (Array.isArray(s.subSection)) total += s.subSection.length;
                }
            }
            courseSubsectionCount[String(c._id)] = total;
        }

        let awards = 0;
        const cursor = CourseProgress.find({}).cursor();
        for (let cp = await cursor.next(); cp != null; cp = await cursor.next()) {
            try {
                const courseId = String(cp.courseID);
                const required = courseSubsectionCount[courseId] ?? 0;
                const completed = Array.isArray(cp.completedVideos) ? cp.completedVideos.length : 0;
                if (required > 0 && completed >= required) awards += 1;
            } catch (e) {
                // ignore single doc errors
            }
        }

        return res.status(200).json({
            success: true,
            data: { totalStudents, mentors, courses, awards },
        });
    } catch (err) {
        console.error("getSiteStats error:", err);
        return res.status(500).json({ success: false, message: err.message || "Failed to fetch stats" });
    }
};
