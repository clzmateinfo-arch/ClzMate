const mongoose = require("mongoose");
const Classroom = require("../models/classroom");
const Announcement = require("../models/announcement");
const Topic = require("../models/topic");
const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const User = require("../models/user");
const { uploadFileToCloudinary, deleteResourceFromCloudinary } = require("../utils/fileUploader");

const pickSingle = (files, key) => {
    if (!files) return null;
    const val = files[key];
    if (!val) return null;
    return Array.isArray(val) ? val[0] : val;
};

const pickMany = (files, key) => {
    if (!files) return [];
    const val = files[key];
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id));

exports.getClassOverview = async (req, res) => {
    try {
        const { classroomId } = req.params;
        if (!isValidId(classroomId)) return res.status(400).json({ success: false, message: "Invalid id" });
        const classroom = await Classroom.findById(classroomId)
            .populate("owner members.user", "firstName lastName email image")
            .lean();
        if (!classroom) return res.status(404).json({ success: false, message: "Classroom not found" });
        const announcements = await Announcement.find({ classroom: classroomId }).sort({ pinned: -1, createdAt: -1 }).limit(20).lean();
        const topicIds = await Topic.find({ classroom: classroomId }).distinct("_id");
        const upcomingAssignments = await Assignment.find({ topic: { $in: topicIds }, dueDate: { $gte: new Date() } })
            .sort({ dueDate: 1 })
            .limit(10)
            .lean();
        return res.json({
            success: true,
            data: {
                classroom,
                announcements,
                upcomingAssignments,
                counts: {
                    members: (classroom.members || []).length,
                    topics: await Topic.countDocuments({ classroom: classroomId }),
                    assignments: await Assignment.countDocuments({ topic: { $in: topicIds } }),
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
        const maxPosDoc = await Topic.findOne({ classroom: classroomId }).sort({ position: -1 }).select("position").lean();
        const position = maxPosDoc ? (maxPosDoc.position || 0) + 1 : 1;
        const t = await Topic.create({ classroom: classroomId, title, description, createdBy: req.user.id, position });
        return res.json({ success: true, data: t });
    } catch (err) {
        console.error("createTopic", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.listTopics = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const topics = await Topic.find({ classroom: classroomId }).sort({ position: 1, "meta.createdAt": -1 }).lean();
        return res.json({ success: true, data: topics });
    } catch (err) {
        console.error("listTopics", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        const payload = req.body || {};
        if (!isValidId(topicId)) return res.status(400).json({ success: false, message: "Invalid topic id" });
        const t = await Topic.findById(topicId);
        if (!t) return res.status(404).json({ success: false, message: "Topic not found" });
        ["title", "description", "status"].forEach((f) => {
            if (payload[f] !== undefined) t[f] = payload[f];
        });
        t.meta = t.meta || {};
        t.meta.updatedAt = new Date();
        await t.save();
        return res.json({ success: true, data: t });
    } catch (err) {
        console.error("updateTopic", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        if (!isValidId(topicId)) {
            return res.status(400).json({ success: false, message: "Invalid topic id" });
        }
        const deletedTopic = await Topic.findByIdAndDelete(topicId);
        let removed = !!deletedTopic;
        let classroomAfterPull = null;
        if (!removed) {
            classroomAfterPull = await Classroom.findOneAndUpdate(
                { "topics._id": topicId },
                { $pull: { topics: { _id: topicId } } },
                { new: true }
            );
            if (classroomAfterPull) {
                removed = true;
            }
        }
        if (!removed) {
            return res.status(404).json({ success: false, message: "Topic not found" });
        }
        const assignments = await Assignment.find({ topic: topicId }).select("_id").lean();
        const assignmentIds = Array.isArray(assignments) ? assignments.map(a => a._id) : [];
        if (assignmentIds.length > 0) {
            await Submission.deleteMany({ assignment: { $in: assignmentIds } });
            await Assignment.deleteMany({ _id: { $in: assignmentIds } });
        }
        return res.json({ success: true, data: { _id: topicId } });
    } catch (err) {
        console.error("deleteTopic", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.reorderTopics = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { order } = req.body;
        if (!Array.isArray(order)) return res.status(400).json({ success: false, message: "order must be array" });
        const bulk = order.map((id, idx) => ({
            updateOne: {
                filter: { _id: id, classroom: classroomId },
                update: { $set: { position: idx + 1, "meta.updatedAt": new Date() } }
            },
        }));
        if (bulk.length > 0) await Topic.bulkWrite(bulk);
        return res.json({ success: true });
    } catch (err) {
        console.error("reorderTopics", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { type, title, content = "", link = "", refId = null } = req.body;
        if (!type || !title) return res.status(400).json({ success: false, message: "type and title required" });
        const t = await Topic.findById(topicId);
        if (!t) return res.status(404).json({ success: false, message: "Topic not found" });
        const nextPos = (t.items && t.items.length > 0) ? Math.max(...t.items.map(i => i.position || 0)) + 1 : 1;
        const item = { type, title, content, link, refId: refId || null, position: nextPos, status: "draft" };
        t.items.push(item);
        t.meta = t.meta || {};
        t.meta.updatedAt = new Date();
        await t.save();
        const created = t.items[t.items.length - 1];
        return res.json({ success: true, data: created });
    } catch (err) {
        console.error("createItem", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { topicId, itemId } = req.params;
        const payload = req.body || {};
        if (!isValidId(topicId) || !isValidId(itemId)) return res.status(400).json({ success: false, message: "Invalid id" });
        const t = await Topic.findById(topicId);
        if (!t) return res.status(404).json({ success: false, message: "Topic not found" });
        const it = t.items.id(itemId);
        if (!it) return res.status(404).json({ success: false, message: "Item not found" });
        ["title", "content", "link", "status", "type"].forEach((f) => {
            if (payload[f] !== undefined) it[f] = payload[f];
        });
        it.meta = it.meta || {};
        it.meta.updatedAt = new Date();
        t.meta.updatedAt = new Date();
        await t.save();
        return res.json({ success: true, data: it });
    } catch (err) {
        console.error("updateItem", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { classroomId, topicId } = req.params;
        if (!isValidId(classroomId) || !isValidId(topicId)) {
            return res.status(400).json({ success: false, message: "Invalid id" });
        }
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ success: false, message: "Classroom not found" });
        const t = classroom.topics.id(topicId);
        if (!t) return res.status(404).json({ success: false, message: "Topic not found" });
        t.remove();
        (classroom.topics || []).forEach((tp, idx) => {
            tp.position = idx + 1;
        });
        classroom.meta = classroom.meta || {};
        classroom.meta.updatedAt = new Date();
        await classroom.save();
        return res.json({ success: true, data: classroom });
    } catch (err) {
        console.error("deleteTopic", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.reorderItems = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { order } = req.body;
        if (!isValidId(topicId) || !Array.isArray(order)) return res.status(400).json({ success: false, message: "Invalid input" });
        const t = await Topic.findById(topicId);
        if (!t) return res.status(404).json({ success: false, message: "Topic not found" });
        const map = {};
        (t.items || []).forEach(it => { map[String(it._id)] = it; });
        const newItems = [];
        order.forEach((id, idx) => {
            const found = map[String(id)];
            if (found) {
                found.position = idx + 1;
                newItems.push(found);
                delete map[String(id)];
            }
        });
        Object.keys(map).forEach((k) => {
            const it = map[k];
            it.position = newItems.length + 1;
            newItems.push(it);
        });
        t.items = newItems;
        t.meta.updatedAt = new Date();
        await t.save();
        return res.json({ success: true });
    } catch (err) {
        console.error("reorderItems", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.toggleItemStatus = async (req, res) => {
    try {
        const { topicId, itemId } = req.params;
        if (!isValidId(topicId) || !isValidId(itemId)) return res.status(400).json({ success: false, message: "Invalid id" });
        const t = await Topic.findById(topicId);
        if (!t) return res.status(404).json({ success: false, message: "Topic not found" });
        const it = t.items.id(itemId);
        if (!it) return res.status(404).json({ success: false, message: "Item not found" });
        it.status = it.status === "published" ? "draft" : "published";
        it.meta = it.meta || {};
        it.meta.updatedAt = new Date();
        t.meta.updatedAt = new Date();
        await t.save();
        return res.json({ success: true, data: it });
    } catch (err) {
        console.error("toggleItemStatus", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.copyItem = async (req, res) => {
    try {
        const { topicId, itemId } = req.params;
        const { destTopicId } = req.body;
        if (!isValidId(topicId) || !isValidId(itemId) || !isValidId(destTopicId)) return res.status(400).json({ success: false, message: "Invalid id" });
        const srcTopic = await Topic.findById(topicId);
        const destTopic = await Topic.findById(destTopicId);
        if (!srcTopic || !destTopic) return res.status(404).json({ success: false, message: "Topic(s) not found" });
        const it = srcTopic.items.id(itemId);
        if (!it) return res.status(404).json({ success: false, message: "Item not found" });
        const newItem = {
            type: it.type,
            title: `${it.title} (copy)`,
            content: it.content,
            link: it.link,
            refId: it.refId || null,
            status: "draft",
            position: (destTopic.items && destTopic.items.length > 0) ? Math.max(...destTopic.items.map(i => i.position || 0)) + 1 : 1,
            meta: { createdAt: new Date(), updatedAt: new Date() },
        };
        destTopic.items.push(newItem);
        destTopic.meta = destTopic.meta || {};
        destTopic.meta.updatedAt = new Date();
        await destTopic.save();
        const created = destTopic.items[destTopic.items.length - 1];
        return res.json({ success: true, data: created });
    } catch (err) {
        console.error("copyItem", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.createAssignment = async (req, res) => {
    try {
        const { topicId } = req.params;
        if (!isValidId(topicId)) return res.status(400).json({ success: false, message: "Invalid topic id" });
        let { title, description, dueDate, maxScore, resources, assigneeType, references, publish } = req.body || {};
        title = title || req.body?.title;
        description = description || req.body?.description || req.body?.instructions || "";
        const points = Number(maxScore ?? req.body?.points) || 100;
        if (!title) return res.status(400).json({ success: false, message: "title required" });
        const topic = await Topic.findById(topicId).select("classroom").lean();
        const topicClassroom = topic?.classroom ? String(topic.classroom) : null;
        let classesAssignedRaw = req.body?.classesAssigned ?? req.body?.otherClasses ?? [];
        if (!classesAssignedRaw) classesAssignedRaw = [];
        if (typeof classesAssignedRaw === "string") {
            try {
                const parsed = JSON.parse(classesAssignedRaw);
                classesAssignedRaw = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                classesAssignedRaw = [classesAssignedRaw];
            }
        }
        if (!Array.isArray(classesAssignedRaw)) {
            classesAssignedRaw = [classesAssignedRaw];
        }
        classesAssignedRaw = classesAssignedRaw.map(String).filter(Boolean);
        if (topicClassroom && !classesAssignedRaw.includes(topicClassroom)) {
            classesAssignedRaw.unshift(topicClassroom);
        }
        const classesAssigned = Array.from(new Set(classesAssignedRaw));
        const supportFiles = pickMany(req.files, "attachments");
        const attachments = [];
        if (supportFiles && supportFiles.length) {
            for (const f of supportFiles) {
                const uploaded = await uploadFileToCloudinary(f, process.env.FOLDER_NAME || "assignments");
                attachments.push({
                    url: uploaded.secure_url || null,
                    publicId: uploaded.public_id || null,
                    originalName: f.name || f.name,
                    mimeType: f.mimetype || null,
                    size: f.size || null,
                    resourceType: uploaded.resource_type || uploaded._resource_type || null,
                });
            }
        }
        const a = await Assignment.create({
            topic: topicId,
            title,
            instructions: description,
            dueDate: dueDate ? new Date(dueDate) : null,
            points,
            createdBy: req.user.id,
            attachments,
            publish: !!(publish === "1" || publish === true || publish === "true"),
            assigneeType: assigneeType || "all",
            assignees: Array.isArray(req.body?.assignees) ? req.body.assignees : (req.body?.assignees ? [req.body.assignees] : []),
            classesAssigned,
            references: references || "",
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

exports.getAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        if (!isValidId(assignmentId)) return res.status(400).json({ success: false, message: "Invalid id" });
        const a = await Assignment.findById(assignmentId).lean();
        if (!a) return res.status(404).json({ success: false, message: "Assignment not found" });
        return res.json({ success: true, data: a });
    } catch (err) {
        console.error("getAssignment", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const payload = req.body || {};
        if (!isValidId(assignmentId)) return res.status(400).json({ success: false, message: "Invalid id" });
        const a = await Assignment.findById(assignmentId);
        if (!a) return res.status(404).json({ success: false, message: "Assignment not found" });
        if (payload.title !== undefined) a.title = payload.title;
        if (payload.description !== undefined) a.instructions = payload.description;
        if (payload.instructions !== undefined) a.instructions = payload.instructions;
        if (payload.dueDate !== undefined) a.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
        if (payload.maxScore !== undefined) a.points = Number(payload.maxScore);
        if (payload.points !== undefined) a.points = Number(payload.points);
        if (payload.references !== undefined) a.references = payload.references;
        if (payload.publish !== undefined) a.publish = !!payload.publish;
        if (payload.assigneeType !== undefined) a.assigneeType = payload.assigneeType;
        if (Array.isArray(payload.assignees)) a.assignees = payload.assignees;
        if (Array.isArray(payload.classesAssigned)) {
            a.classesAssigned = payload.classesAssigned;
        } else if (payload.classesAssigned !== undefined) {
            let list = payload.classesAssigned;
            if (typeof list === "string") {
                try { list = JSON.parse(list); } catch (e) { list = [list]; }
            }
            if (!Array.isArray(list)) list = [list];
            a.classesAssigned = list.map(String).filter(Boolean);
        }
        let removeList = payload.removeAttachments || payload.removeAttachments || [];
        if (typeof removeList === "string") {
            try { removeList = JSON.parse(removeList); } catch (e) { removeList = [removeList]; }
        }
        if (Array.isArray(removeList) && removeList.length) {
            a.attachments = (a.attachments || []).filter(att => {
                const match = removeList.includes(att.publicId) || removeList.includes(att.url) || removeList.includes(att.originalName) || removeList.includes(att._id?.toString?.());
                if (match) {
                    try { deleteResourceFromCloudinary(att.publicId || att.url, att.resourceType); }
                    catch (e) { console.warn("Failed to delete assignment attachment:", e.message); }
                }
                return !match;
            });
        }
        const newFiles = pickMany(req.files, "attachments");
        if (newFiles && newFiles.length) {
            for (const f of newFiles) {
                const uploaded = await uploadFileToCloudinary(f, process.env.FOLDER_NAME || "assignments");
                a.attachments.push({
                    url: uploaded.secure_url || null,
                    publicId: uploaded.public_id || null,
                    originalName: f.name || f.name,
                    mimeType: f.mimetype || null,
                    size: f.size || null,
                    resourceType: uploaded.resource_type || uploaded._resource_type || null,
                });
            }
        }
        a.updatedAt = new Date();
        await a.save();
        return res.json({ success: true, data: a });
    } catch (err) {
        console.error("updateAssignment", err);
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
