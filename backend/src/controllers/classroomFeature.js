const Classroom = require("../models/classroom");
const Announcement = require("../models/Announcement");
const Topic = require("../models/Topic");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/user");
const mongoose = require("mongoose");

exports.getClassOverview = async (req, res) => {
    try {
        const { classroomId } = req.params;
        if (!mongoose.isValidObjectId(classroomId)) return res.status(400).json({ success: false, message: "Invalid id" });

        const classroom = await Classroom.findById(classroomId)
            .populate("owner members.user", "firstName lastName email image")
            .lean();
        if (!classroom) return res.status(404).json({ success: false, message: "Classroom not found" });

        const announcements = await Announcement.find({ classroom: classroomId }).sort({ pinned: -1, createdAt: -1 }).limit(20).lean();
        const upcomingAssignments = await Assignment.find({ topic: { $in: await Topic.find({ classroom: classroomId }).distinct("_id") }, dueDate: { $gte: new Date() } }).sort({ dueDate: 1 }).limit(10).lean();

        return res.json({
            success: true,
            data: {
                classroom,
                announcements,
                upcomingAssignments,
                counts: {
                    members: (classroom.members || []).length,
                    topics: await Topic.countDocuments({ classroom: classroomId }),
                    assignments: await Assignment.countDocuments({ topic: { $in: await Topic.find({ classroom: classroomId }).distinct("_id") } }),
                },
            },
        });
    } catch (err) {
        console.error("getClassOverview", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.createAnnouncement = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { title, body, pinned } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "Title is required" });

        const ann = await Announcement.create({
            classroom: classroomId,
            author: req.user.id,
            title,
            body,
            pinned: !!pinned,
        });

        return res.status(200).json({ success: true, data: ann });
    } catch (err) {
        console.error("createAnnouncement", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.listAnnouncements = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const anns = await Announcement.find({ classroom: classroomId }).sort({ pinned: -1, createdAt: -1 }).lean();
        return res.json({ success: true, data: anns });
    } catch (err) {
        console.error("listAnnouncements", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.createTopic = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "title required" });

        const t = await Topic.create({ classroom: classroomId, title, description, createdBy: req.user.id });
        return res.json({ success: true, data: t });
    } catch (err) {
        console.error("createTopic", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.listTopics = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const topics = await Topic.find({ classroom: classroomId }).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, data: topics });
    } catch (err) {
        console.error("listTopics", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.createAssignment = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { title, description, dueDate, maxScore, resources } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "title required" });

        const a = await Assignment.create({
            topic: topicId,
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : null,
            maxScore: Number(maxScore) || 100,
            createdBy: req.user.id,
            resources: resources || [],
        });

        await Topic.findByIdAndUpdate(topicId, { $inc: { assignmentsCount: 1 } });

        return res.json({ success: true, data: a });
    } catch (err) {
        console.error("createAssignment", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.listAssignmentsByTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        const assignments = await Assignment.find({ topic: topicId }).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, data: assignments });
    } catch (err) {
        console.error("listAssignmentsByTopic", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.submitAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { content } = req.body;
        const submission = await Submission.create({
            assignment: assignmentId,
            student: req.user.id,
            content: content || "",
            attachments: req.body.attachments || [],
        });
        return res.json({ success: true, data: submission });
    } catch (err) {
        console.error("submitAssignment", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const subs = await Submission.find({ assignment: assignmentId }).populate("student", "firstName lastName email image").sort({ submittedAt: -1 }).lean();
        return res.json({ success: true, data: subs });
    } catch (err) {
        console.error("getSubmissions", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.gradeSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { score, feedback } = req.body;
        const s = await Submission.findById(submissionId);
        if (!s) return res.status(404).json({ success: false, message: "Submission not found" });

        s.grade = { score: Number(score), feedback: feedback || "", gradedBy: req.user.id, gradedAt: new Date() };
        await s.save();
        return res.json({ success: true, data: s });
    } catch (err) {
        console.error("gradeSubmission", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
