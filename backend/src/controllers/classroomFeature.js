const mongoose = require("mongoose");
const Classroom = require("../models/classroom");
const Announcement = require("../models/announcement");
const Topic = require("../models/topic");
const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const User = require("../models/user");
const Quiz = require("../models/quiz");
const Attempt = require("../models/attempt");
const { uploadFileToCloudinary, deleteResourceFromCloudinary } = require("../utils/fileUploader");
const { evaluateScreenAnswer } = require("../utils/quizz");

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

        let removeList = payload.removeAttachments || payload.removeAttachments || [];
        if (typeof removeList === "string") {
            try { removeList = JSON.parse(removeList); } catch (e) { removeList = [removeList]; }
        }
        if (Array.isArray(removeList) && removeList.length) {
            it.attachments = (it.attachments || []).filter(att => {
                const match = removeList.includes(att.publicId) || removeList.includes(att.url) || removeList.includes(att.originalName) || removeList.includes(att._id?.toString?.());
                if (match) {
                    try { deleteResourceFromCloudinary(att.publicId || att.url, att.resourceType); } catch (e) { console.warn("Failed to delete item attachment:", e.message); }
                }
                return !match;
            });
        }

        const newFiles = pickMany(req.files, "attachments");
        if (newFiles && newFiles.length) {
            it.attachments = it.attachments || [];
            for (const f of newFiles) {
                const uploaded = await uploadFileToCloudinary(f, process.env.FOLDER_NAME || "materials");
                it.attachments.push({
                    url: uploaded.secure_url || null,
                    publicId: uploaded.public_id || null,
                    originalName: f.name || f.originalname || f.name,
                    mimeType: f.mimetype || null,
                    size: f.size || null,
                    resourceType: uploaded.resource_type || uploaded._resource_type || null,
                });
            }
        }

        it.meta = it.meta || {};
        it.meta.updatedAt = new Date();
        t.meta = t.meta || {};
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

        let { title, description, dueDate, maxScore, resources, assigneeType, references, publish, lockSubmissions } = req.body || {};
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
                    originalName: f.name || f.originalname || f.name,
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
            lockSubmissions: !!(lockSubmissions === "1" || lockSubmissions === true || lockSubmissions === "true"),
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

exports.listPublishedAssignmentsByTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        if (!isValidId(topicId)) {
            return res.status(400).json({ success: false, message: "Invalid topic id" });
        }

        // Load all published assignments for the topic
        const assignments = await Assignment.find({ topic: topicId, publish: true })
            .sort({ createdAt: -1 })
            .lean();

        // If no user info (shouldn't happen because route is protected), just return what we have
        const user = req.user || {};
        const userIdStr = user.id ? String(user.id) : null;
        const acct = (user.accountType || user.role || "").toString().toLowerCase();

        // Treat instructors/admins as privileged: return all published assignments
        const isInstructorLike =
            acct === "instructor" || acct === "admin" || !!user.isInstructor || !!user.isAdmin;

        if (isInstructorLike) {
            return res.json({ success: true, data: assignments });
        }

        // Non-instructor user (student/guest/etc.) -> filter assignments to only those relevant to the user

        // 1) find classrooms where the user is a member (to match against classesAssigned)
        const userClassroomIds = await Classroom.find({ "members.user": user.id }).distinct("_id");
        const userClassIdsStr = (userClassroomIds || []).map((c) => String(c));

        // 2) filter assignments:
        // - if assigneeType === 'selected' => include only if assignees includes the user
        // - if assigneeType !== 'selected' (treat as 'all') => include if classesAssigned intersects user's classrooms
        //   - if classesAssigned is empty, treat it as global and include
        const filtered = (assignments || []).filter((a) => {
            const assigneeType = (a.assigneeType || "all").toString().toLowerCase();

            // selected explicit students
            if (assigneeType === "selected") {
                const explicit = (a.assignees || []).map(String);
                if (!userIdStr) return false;
                return explicit.includes(userIdStr);
            }

            // 'all' case: match by classesAssigned intersection
            const assignedClasses = (a.classesAssigned || []).map(String);
            // If no classes assigned, treat as global (accessible to everyone)
            if (!assignedClasses || assignedClasses.length === 0) return true;
            // otherwise require intersection
            return assignedClasses.some((cid) => userClassIdsStr.includes(cid));
        });

        return res.json({ success: true, data: filtered });
    } catch (err) {
        console.error("listPublishedAssignmentsByTopic", err);
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

        // NEW: lockSubmissions handling (instructor can toggle)
        if (payload.lockSubmissions !== undefined) {
            a.lockSubmissions = !!payload.lockSubmissions;
        }

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
        if (!isValidId(assignmentId)) return res.status(400).json({ success: false, message: "Invalid assignment id" });

        const assignment = await Assignment.findById(assignmentId).lean();
        if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

        // Check lock or due date
        const now = new Date();
        if (assignment.lockSubmissions) {
            return res.status(403).json({ success: false, message: "Submissions have been locked by the instructor" });
        }
        if (assignment.dueDate && now > new Date(assignment.dueDate)) {
            return res.status(403).json({ success: false, message: "Submission window has closed (due date passed)" });
        }

        // parse body fields
        const content = req.body.content || "";
        let removeList = req.body.removeAttachments || req.body.remove || [];
        if (typeof removeList === "string") {
            try { removeList = JSON.parse(removeList); } catch (e) { removeList = [removeList]; }
        }
        if (!Array.isArray(removeList)) removeList = [];

        // handle uploaded files
        const newFiles = pickMany(req.files, "attachments");
        const uploadedAttachments = [];
        if (newFiles && newFiles.length) {
            for (const f of newFiles) {
                try {
                    const uploaded = await uploadFileToCloudinary(f, process.env.FOLDER_NAME || "submissions");
                    uploadedAttachments.push({
                        url: uploaded.secure_url || null,
                        publicId: uploaded.public_id || null,
                        originalName: f.originalname || f.name,
                        mimeType: f.mimetype || null,
                        size: f.size || null,
                        resourceType: uploaded.resource_type || uploaded._resource_type || null,
                    });
                } catch (uerr) {
                    console.warn("upload for submission file failed", uerr);
                }
            }
        }

        // find existing submission for this student
        let sub = await Submission.findOne({ assignment: assignmentId, student: req.user.id });

        if (!sub) {
            // create new submission
            sub = new Submission({
                assignment: assignmentId,
                student: req.user.id,
                content,
                attachments: uploadedAttachments,
                submittedAt: new Date(),
            });
            await sub.save();
            return res.json({ success: true, data: sub });
        }

        // existing submission -> revise if allowed (we already checked lock/dueDate)
        // remove attachments listed in removeList (if any)
        if (Array.isArray(removeList) && removeList.length) {
            const kept = [];
            for (const att of sub.attachments || []) {
                const match = removeList.includes(att.publicId) || removeList.includes(att.url) || removeList.includes(att.originalName) || removeList.includes(att._id?.toString?.());
                if (match) {
                    try {
                        if (att.publicId) await deleteResourceFromCloudinary(att.publicId, att.resourceType);
                    } catch (e) {
                        console.warn("failed to delete old submission file:", e);
                    }
                    // skip
                } else {
                    kept.push(att);
                }
            }
            sub.attachments = kept;
        }

        // append new uploaded files (do not delete old ones unless requested)
        if (uploadedAttachments.length) {
            sub.attachments = (sub.attachments || []).concat(uploadedAttachments);
        }

        // update content and timestamp
        sub.content = content || sub.content;
        sub.submittedAt = new Date();
        await sub.save();

        return res.json({ success: true, data: sub });
    } catch (err) {
        console.error("submitAssignment", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMySubmission = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        if (!isValidId(assignmentId)) return res.status(400).json({ success: false, message: "Invalid assignment id" });
        const sub = await Submission.findOne({ assignment: assignmentId, student: req.user.id }).lean();
        if (!sub) return res.json({ success: true, data: null });
        return res.json({ success: true, data: sub });
    } catch (err) {
        console.error("getMySubmission", err);
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

exports.createQuiz = async (req, res) => {
    try {
        const { topicId } = req.params;
        let { title, description, timeLimit, shuffle } = req.body || {};
        if (!title) return res.status(400).json({ success: false, message: "title required" });
        const q = await Quiz.create({ topic: topicId, title: title.trim(), description: description || "", timeLimit: Number(timeLimit) || 0, shuffle: !!shuffle, createdBy: req.user.id });
        return res.json({ success: true, data: q });
    } catch (err) {
        console.error("createQuiz", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(String(quizId))) return res.status(400).json({ success: false, message: "Invalid id" });
        const q = await Quiz.findById(quizId).lean();
        if (!q) return res.status(404).json({ success: false, message: "Quiz not found" });
        return res.json({ success: true, data: q });
    } catch (err) {
        console.error("getQuiz", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const payload = req.body || {};
        if (!mongoose.Types.ObjectId.isValid(String(quizId))) return res.status(400).json({ success: false, message: "Invalid id" });
        const q = await Quiz.findById(quizId);
        if (!q) return res.status(404).json({ success: false, message: "Quiz not found" });
        ["title", "description"].forEach((f) => { if (payload[f] !== undefined) q[f] = payload[f]; });
        if (payload.timeLimit !== undefined) q.timeLimit = Number(payload.timeLimit) || 0;
        if (payload.shuffle !== undefined) q.shuffle = !!payload.shuffle;
        if (payload.publish !== undefined) q.publish = !!payload.publish;
        q.meta = q.meta || {}; q.meta.updatedAt = new Date();
        await q.save();
        return res.json({ success: true, data: q });
    } catch (err) {
        console.error("updateQuiz", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.listQuizzesByTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        if (!isValidId(topicId)) return res.status(400).json({ success: false, message: "Invalid topic id" });
        const quizzes = await Quiz.find({ topic: topicId }).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, data: quizzes });
    } catch (err) {
        console.error("listQuizzesByTopic", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.listPublishedQuizzesByTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        if (!isValidId(topicId)) return res.status(400).json({ success: false, message: "Invalid topic id" });
        const quizzes = await Quiz.find({ topic: topicId, publish: true }).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, data: quizzes });
    } catch (err) {
        console.error("listPublishedQuizzesByTopic", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        if (!isValidId(quizId)) return res.status(400).json({ success: false, message: "Invalid quiz id" });

        const q = await Quiz.findByIdAndDelete(quizId);
        if (!q) return res.status(404).json({ success: false, message: "Quiz not found" });

        return res.json({ success: true, data: { _id: quizId } });
    } catch (err) {
        console.error("deleteQuiz", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.createScreen = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { type, body = "", options = [], properties = {} } = req.body;
        if (!type) return res.status(400).json({ success: false, message: "type required" });
        const q = await Quiz.findById(quizId);
        if (!q) return res.status(404).json({ success: false, message: "Quiz not found" });
        const nextPos = (q.screens && q.screens.length > 0) ? Math.max(...q.screens.map((s) => s.position || 0)) + 1 : 1;
        const screen = { type, body, options, properties, position: nextPos, status: "draft" };
        q.screens.push(screen);
        q.meta = q.meta || {}; q.meta.updatedAt = new Date();
        await q.save();
        const created = q.screens[q.screens.length - 1];
        return res.json({ success: true, data: created });
    } catch (err) {
        console.error("createScreen", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateScreen = async (req, res) => {
    try {
        const { screenId } = req.params;
        const payload = req.body || {};
        const q = await Quiz.findOne({ "screens._id": screenId });
        if (!q) return res.status(404).json({ success: false, message: "Screen not found" });
        const sc = q.screens.id(screenId);
        if (!sc) return res.status(404).json({ success: false, message: "Screen not found" });
        ["body", "type", "status"].forEach((f) => { if (payload[f] !== undefined) sc[f] = payload[f]; });
        if (payload.options !== undefined) sc.options = payload.options;
        if (payload.properties !== undefined) sc.properties = payload.properties;
        sc.meta = sc.meta || {}; sc.meta.updatedAt = new Date();
        q.meta = q.meta || {}; q.meta.updatedAt = new Date();
        await q.save();
        return res.json({ success: true, data: sc });
    } catch (err) {
        console.error("updateScreen", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteScreen = async (req, res) => {
    try {
        const { quizId, screenId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(String(quizId)) || !mongoose.Types.ObjectId.isValid(String(screenId))) return res.status(400).json({ success: false, message: "Invalid id" });
        const q = await Quiz.findById(quizId);
        if (!q) return res.status(404).json({ success: false, message: "Quiz not found" });
        q.screens = q.screens.filter((s) => String(s._id) !== String(screenId));
        q.screens.forEach((s, idx) => { s.position = idx + 1; });
        q.meta = q.meta || {}; q.meta.updatedAt = new Date();
        await q.save();
        return res.json({ success: true, data: q });
    } catch (err) {
        console.error("deleteScreen", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.reorderScreens = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { order } = req.body;
        if (!Array.isArray(order)) return res.status(400).json({ success: false, message: "order must be array" });
        const q = await Quiz.findById(quizId);
        if (!q) return res.status(404).json({ success: false, message: "Quiz not found" });
        const map = {};
        (q.screens || []).forEach((s) => { map[String(s._id)] = s; });
        const newScreens = [];
        order.forEach((id, idx) => {
            const found = map[String(id)];
            if (found) {
                found.position = idx + 1;
                newScreens.push(found);
                delete map[String(id)];
            }
        });
        Object.keys(map).forEach((k) => {
            const s = map[k];
            s.position = newScreens.length + 1;
            newScreens.push(s);
        });
        q.screens = newScreens;
        q.meta = q.meta || {}; q.meta.updatedAt = new Date();
        await q.save();
        return res.json({ success: true });
    } catch (err) {
        console.error("reorderScreens", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateSubmission = async (req, res) => {
    try {
        const { assignmentId, submissionId } = req.params;
        const payload = req.body || {};
        if (!isValidId(assignmentId) || !isValidId(submissionId)) return res.status(400).json({ success: false, message: "Invalid id" });

        const sub = await Submission.findOne({ _id: submissionId, assignment: assignmentId });
        if (!sub) return res.status(404).json({ success: false, message: "Submission not found" });

        let changed = false;
        if (payload.grade !== undefined) {
            sub.grade = payload.grade === "" || payload.grade === null ? null : Number(payload.grade);
            changed = true;
        }
        if (payload.feedback !== undefined) {
            sub.feedback = payload.feedback;
            changed = true;
        }
        if (changed) {
            sub.gradedBy = req.user.id;
            sub.gradedAt = new Date();
            await sub.save();
        }

        const populated = await Submission.findById(sub._id).populate("student", "firstName lastName email image").populate("gradedBy", "firstName lastName email").lean();

        return res.json({ success: true, data: populated });
    } catch (err) {
        console.error("updateSubmission", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.submitAttempt = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        if (!mongoose.Types.ObjectId.isValid(String(quizId))) {
            return res.status(400).json({ success: false, message: "Invalid quiz id" });
        }

        const payload = req.body || {};
        const incoming = Array.isArray(payload.answers) ? payload.answers : [];
        const finishNow = !!payload.finish;

        const quiz = await Quiz.findById(quizId).lean();
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        let attempt = await Attempt.findOne({ quiz: quizId, user: userId });
        if (!attempt) {
            attempt = new Attempt({ quiz: quizId, user: userId, answers: [], totalPoints: 0 });
        }

        const screenMap = {};
        (quiz.screens || []).forEach(s => { screenMap[String(s._id)] = s; });

        for (const ans of incoming) {
            const sid = String(ans.screenId);
            if (!screenMap[sid]) continue;
            const timeTaken = Number(ans.timeTaken || 0);
            const provided = ans.provided;
            const evalRes = evaluateScreenAnswer(screenMap[sid], provided, timeTaken);

            const idx = attempt.answers.findIndex(a => String(a.screenId) === sid);
            const entry = {
                screenId: new mongoose.Types.ObjectId(sid),
                provided,
                correct: !!evalRes.correct,
                points: evalRes.pointsEarned,
                basePoints: evalRes.base,
                timeTaken: evalRes.timeTaken,
                timeBonus: evalRes.timeBonus
            };

            if (idx === -1) attempt.answers.push(entry);
            else attempt.answers[idx] = entry;
        }

        attempt.totalPoints = (attempt.answers || []).reduce((s, a) => s + (a.points || 0), 0);
        if (finishNow) attempt.finishedAt = new Date();
        attempt.meta = attempt.meta || {};
        attempt.meta.updatedAt = new Date();
        await attempt.save();

        return res.json({ success: true, data: attempt });
    } catch (err) {
        console.error("submitAttempt", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const { quizId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(String(quizId))) {
            return res.status(400).json({ success: false, message: "Invalid quiz id" });
        }

        const pipeline = [
            { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },
            { $sort: { totalPoints: -1, finishedAt: 1 } },
            {
                $group: {
                    _id: "$user",
                    bestScore: { $max: "$totalPoints" },
                    lastAttemptAt: { $first: "$finishedAt" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
                    score: "$bestScore",
                    lastAttemptAt: 1
                }
            },
            { $sort: { score: -1, lastAttemptAt: 1 } }
        ];

        const rows = await Attempt.aggregate(pipeline).allowDiskUse(true);

        const board = (rows || []).map((r, i) => ({
            id: String(r.userId),
            name: r.name || "Unknown",
            score: r.score || 0,
            rank: i + 1
        }));

        const userIdStr = String(req.user.id);
        const meRow = board.find(b => b.id === userIdStr) || null;

        return res.json({ success: true, data: { board, me: meRow } });
    } catch (err) {
        console.error("getLeaderboard", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

