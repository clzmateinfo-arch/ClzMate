const User = require("../models/user");
const Course = require("../models/course");
const CourseProgress = require("../models/courseProgress");
const { sendServerError } = require("../utils/validators");

const CACHE_TTL_MS = 60 * 1000;

let cachedStats = null;
let cachedAt = 0;

async function countCompletedCourses() {
    const [result] = await CourseProgress.aggregate([
        { $lookup: { from: "courses", localField: "courseID", foreignField: "_id", as: "course" } },
        { $unwind: "$course" },
        { $lookup: { from: "sections", localField: "course.courseContent", foreignField: "_id", as: "sections" } },
        {
            $project: {
                required: { $sum: { $map: { input: "$sections", as: "section", in: { $size: { $ifNull: ["$$section.subSection", []] } } } } },
                completed: { $size: { $ifNull: ["$completedVideos", []] } },
            },
        },
        { $match: { $expr: { $and: [{ $gt: ["$required", 0] }, { $gte: ["$completed", "$required"] }] } } },
        { $count: "awards" },
    ]);
    return result?.awards || 0;
}

async function computeStats() {
    const [totalStudents, mentors, courses, awards] = await Promise.all([
        User.countDocuments({ accountType: "Student" }),
        User.countDocuments({ accountType: "Instructor" }),
        Course.countDocuments({}),
        countCompletedCourses(),
    ]);
    return { totalStudents, mentors, courses, awards };
}

exports.getSiteStats = async (req, res) => {
    try {
        if (!cachedStats || Date.now() - cachedAt > CACHE_TTL_MS) {
            cachedStats = await computeStats();
            cachedAt = Date.now();
        }
        return res.status(200).json({ success: true, data: cachedStats });
    } catch (error) {
        return sendServerError(res, "getSiteStats error:", error, "Failed to fetch stats");
    }
};

exports.resetStatsCache = () => {
    cachedStats = null;
    cachedAt = 0;
};
