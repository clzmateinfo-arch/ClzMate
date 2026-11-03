const mongoose = require("mongoose");
const Announcement = require("../models/announcement");
const Topic = require("../models/topic");
const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const Quiz = require("../models/quiz");
const Attempt = require("../models/attempt");
const { uploadFileToCloudinary, deleteResourceFromCloudinary } = require("../utils/fileUploader");
const { evaluateScreenAnswer } = require("../utils/quizz");
const { isNonEmptyString } = require("../middleware/sanitize");
const {
    HttpError,
    isValidId,
    assertValidId,
    sendError,
    getRoleInClassroom,
    assertMember,
    assertStaff,
    isStaffRole,
    loadClassroomOrFail,
    loadTopicContext,
    loadAssignmentContext,
    loadQuizContext,
    loadScreenContext,
    isAssignmentTargetedAt,
    serializeClassroomForViewer,
} = require("../utils/classroomAccess");

const USER_PUBLIC_FIELDS = "firstName lastName email image";
const MAX_TITLE_LENGTH = 300;
const MAX_TEXT_LENGTH = 20000;
const MAX_LIST_LENGTH = 500;
const MAX_ANSWERS_PER_REQUEST = 200;
const MAX_SUBMISSION_FILES = 10;

const pickMany = (files, key) => {
    const value = files && files[key];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};

const parseBoolean = (value) => value === true || value === "true" || value === "1" || value === 1;

function requireText(value, label, maxLength = MAX_TITLE_LENGTH) {
    if (!isNonEmptyString(value) || value.trim().length > maxLength) {
        throw new HttpError(400, `${label} is required`);
    }
    return value.trim();
}

function optionalText(value, label, maxLength = MAX_TEXT_LENGTH) {
    if (value === undefined || value === null) return "";
    if (typeof value !== "string" || value.length > maxLength) throw new HttpError(400, `Invalid ${label}`);
    return value;
}

function optionalLink(value) {
    const link = optionalText(value, "link", 2048).trim();
    if (link && !/^https?:\/\//i.test(link)) throw new HttpError(400, "Link must start with http:// or https://");
    return link;
}

function parseList(value) {
    if (value === undefined || value === null || value === "") return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            return [value];
        }
    }
    throw new HttpError(400, "Invalid list");
}

function parseIdList(value, label) {
    const list = parseList(value);
    if (list.length > MAX_LIST_LENGTH || !list.every(isValidId)) throw new HttpError(400, `Invalid ${label}`);
    return Array.from(new Set(list));
}

function parseStringList(value, label) {
    const list = parseList(value);
    if (list.length > MAX_LIST_LENGTH || !list.every((entry) => typeof entry === "string")) {
        throw new HttpError(400, `Invalid ${label}`);
    }
    return list;
}

function parseOptionalDate(value, label) {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new HttpError(400, `Invalid ${label}`);
    return date;
}

function parsePoints(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    const points = Number(value);
    if (!Number.isFinite(points) || points < 0) throw new HttpError(400, "points must be a non-negative number");
    return points;
}

const matchesAttachment = (attachment, removeList) =>
    removeList.includes(attachment.publicId) ||
    removeList.includes(attachment.url) ||
    removeList.includes(attachment.originalName) ||
    removeList.includes(String(attachment._id));

async function uploadAttachments(files, folder) {
    const uploadedList = [];
    for (const file of files) {
        const uploaded = await uploadFileToCloudinary(file, folder);
        uploadedList.push({
            url: uploaded.secure_url || "",
            publicId: uploaded.public_id || "",
            originalName: file.name || "",
            mimeType: file.mimetype || "",
            size: file.size || 0,
            resourceType: uploaded.resource_type || uploaded._resource_type || "",
        });
    }
    return uploadedList;
}

async function discardCloudFiles(attachments) {
    await Promise.allSettled(
        (attachments || [])
            .filter((attachment) => attachment && attachment.publicId)
            .map((attachment) => deleteResourceFromCloudinary(attachment.publicId, attachment.resourceType))
    );
}

function applyAttachmentRemoval(attachments, removeList) {
    const removed = [];
    const kept = [];
    for (const attachment of attachments || []) {
        (matchesAttachment(attachment, removeList) ? removed : kept).push(attachment);
    }
    return { kept, removed };
}

function stripQuizAnswerKeys(quizPlain) {
    return {
        ...quizPlain,
        screens: (quizPlain.screens || []).map((screen) => {
            const hidesOptions = screen.type === "short" || screen.type === "slider";
            return {
                ...screen,
                options: hidesOptions ? [] : (screen.options || []).map(({ correct, ...option }) => option),
            };
        }),
    };
}

async function viewQuizForUser(quiz, userId, isStaff) {
    const plain = typeof quiz.toObject === "function" ? quiz.toObject() : quiz;
    if (isStaff) return plain;
    const hasFinishedAttempt = await Attempt.exists({ quiz: plain._id, user: userId, finishedAt: { $ne: null } });
    return hasFinishedAttempt ? plain : stripQuizAnswerKeys(plain);
}

async function deleteAssignmentsCascade(assignmentIds) {
    if (!assignmentIds.length) return;
    const assignments = await Assignment.find({ _id: { $in: assignmentIds } }).select("attachments").lean();
    const submissions = await Submission.find({ assignment: { $in: assignmentIds } }).select("attachments").lean();
    await Submission.deleteMany({ assignment: { $in: assignmentIds } });
    await Assignment.deleteMany({ _id: { $in: assignmentIds } });
    await discardCloudFiles([...assignments, ...submissions].flatMap((doc) => doc.attachments || []));
}

async function deleteQuizzesCascade(quizIds) {
    if (!quizIds.length) return;
    await Attempt.deleteMany({ quiz: { $in: quizIds } });
    await Quiz.deleteMany({ _id: { $in: quizIds } });
}

function assigneeVisibilityFilter(isStaff) {
    return isStaff ? {} : { publish: true };
}

async function resolveAssignees(classroom, assigneeType, rawAssignees) {
    if (assigneeType === undefined && rawAssignees === undefined) return {};
    const result = {};
    if (assigneeType !== undefined) {
        if (!["all", "selected"].includes(assigneeType)) throw new HttpError(400, "Invalid assigneeType");
        result.assigneeType = assigneeType;
    }
    if (rawAssignees !== undefined) {
        const assignees = parseIdList(rawAssignees, "assignees");
        if (assignees.some((id) => !getRoleInClassroom(classroom, id))) {
            throw new HttpError(400, "Every assignee must belong to the classroom");
        }
        result.assignees = assignees;
    }
    return result;
}

exports.getClassOverview = async (req, res) => {
    try {
        const classroom = await loadClassroomOrFail(req.params.classroomId);
        const role = assertMember(classroom, req.user);
        const isStaff = isStaffRole(role);
        const classroomId = classroom._id;

        await classroom.populate([
            { path: "owner", select: USER_PUBLIC_FIELDS },
            { path: "members.user", select: USER_PUBLIC_FIELDS },
        ]);

        const topicIds = await Topic.find({ classroom: classroomId }).distinct("_id");
        const visibility = assigneeVisibilityFilter(isStaff);
        const upcomingCandidates = await Assignment.find({ topic: { $in: topicIds }, dueDate: { $gte: new Date() }, ...visibility })
            .sort({ dueDate: 1 })
            .lean();
        const upcomingAssignments = (isStaff
            ? upcomingCandidates
            : upcomingCandidates.filter((assignment) => isAssignmentTargetedAt(assignment, req.user.id))
        ).slice(0, 10);

        const [announcements, topicsCount, assignmentsCount] = await Promise.all([
            Announcement.find({ classroom: classroomId }).sort({ pinned: -1, createdAt: -1 }).limit(20).lean(),
            Topic.countDocuments({ classroom: classroomId }),
            Assignment.countDocuments({ topic: { $in: topicIds }, ...visibility }),
        ]);

        return res.json({
            success: true,
            data: {
                classroom: serializeClassroomForViewer(classroom, isStaff),
                announcements,
                upcomingAssignments,
                counts: {
                    members: classroom.members.length,
                    topics: topicsCount,
                    assignments: assignmentsCount,
                },
            },
        });
    } catch (error) {
        return sendError(res, error, "getClassOverview");
    }
};

exports.createAnnouncement = async (req, res) => {
    try {
        const classroom = await loadClassroomOrFail(req.params.classroomId);
        assertStaff(classroom, req.user);
        const { title, body, pinned } = req.body || {};
        const announcement = await Announcement.create({
            classroom: classroom._id,
            author: req.user.id,
            title: requireText(title, "Title"),
            body: optionalText(body, "body"),
            pinned: parseBoolean(pinned),
        });
        return res.status(200).json({ success: true, data: announcement });
    } catch (error) {
        return sendError(res, error, "createAnnouncement");
    }
};

exports.listAnnouncements = async (req, res) => {
    try {
        const classroom = await loadClassroomOrFail(req.params.classroomId);
        assertMember(classroom, req.user);
        const announcements = await Announcement.find({ classroom: classroom._id }).sort({ pinned: -1, createdAt: -1 }).lean();
        return res.json({ success: true, data: announcements });
    } catch (error) {
        return sendError(res, error, "listAnnouncements");
    }
};

exports.createTopic = async (req, res) => {
    try {
        const classroom = await loadClassroomOrFail(req.params.classroomId);
        assertStaff(classroom, req.user);
        const { title, description } = req.body || {};
        const cleanTitle = requireText(title, "title");
        const cleanDescription = optionalText(description, "description");
        const lastTopic = await Topic.findOne({ classroom: classroom._id }).sort({ position: -1 }).select("position").lean();
        const topic = await Topic.create({
            classroom: classroom._id,
            title: cleanTitle,
            description: cleanDescription,
            createdBy: req.user.id,
            position: lastTopic ? (lastTopic.position || 0) + 1 : 1,
        });
        return res.json({ success: true, data: topic });
    } catch (error) {
        return sendError(res, error, "createTopic");
    }
};

exports.listTopics = async (req, res) => {
    try {
        const classroom = await loadClassroomOrFail(req.params.classroomId);
        const isStaff = isStaffRole(assertMember(classroom, req.user));
        const topics = await Topic.find({ classroom: classroom._id }).sort({ position: 1, "meta.createdAt": -1 }).lean();
        const data = isStaff
            ? topics
            : topics.map((topic) => ({ ...topic, items: (topic.items || []).filter((item) => item.status === "published") }));
        return res.json({ success: true, data });
    } catch (error) {
        return sendError(res, error, "listTopics");
    }
};

exports.updateTopic = async (req, res) => {
    try {
        const { topic, classroom } = await loadTopicContext(req.params.topicId);
        assertStaff(classroom, req.user);
        const payload = req.body || {};
        if (payload.title !== undefined) topic.title = requireText(payload.title, "title");
        if (payload.description !== undefined) topic.description = optionalText(payload.description, "description");
        if (payload.status !== undefined) topic.status = payload.status;
        topic.meta.updatedAt = new Date();
        await topic.save();
        return res.json({ success: true, data: topic });
    } catch (error) {
        return sendError(res, error, "updateTopic");
    }
};

exports.deleteTopic = async (req, res) => {
    try {
        const { topic, classroom } = await loadTopicContext(req.params.topicId);
        assertStaff(classroom, req.user);
        const assignmentIds = await Assignment.find({ topic: topic._id }).distinct("_id");
        const quizIds = await Quiz.find({ topic: topic._id }).distinct("_id");
        await deleteAssignmentsCascade(assignmentIds);
        await deleteQuizzesCascade(quizIds);
        await topic.deleteOne();
        return res.json({ success: true, data: { _id: String(topic._id) } });
    } catch (error) {
        return sendError(res, error, "deleteTopic");
    }
};

exports.reorderTopics = async (req, res) => {
    try {
        const classroom = await loadClassroomOrFail(req.params.classroomId);
        assertStaff(classroom, req.user);
        const order = req.body && req.body.order;
        if (!Array.isArray(order) || order.length > MAX_LIST_LENGTH || !order.every(isValidId)) {
            throw new HttpError(400, "order must be an array of topic ids");
        }
        const now = new Date();
        const operations = order.map((topicId, index) => ({
            updateOne: {
                filter: { _id: topicId, classroom: classroom._id },
                update: { $set: { position: index + 1, "meta.updatedAt": now } },
            },
        }));
        if (operations.length > 0) await Topic.bulkWrite(operations);
        return res.json({ success: true });
    } catch (error) {
        return sendError(res, error, "reorderTopics");
    }
};

exports.createItem = async (req, res) => {
    try {
        const { topic, classroom } = await loadTopicContext(req.params.topicId);
        assertStaff(classroom, req.user);
        const { type, title, content, link, refId } = req.body || {};
        if (!isNonEmptyString(type)) throw new HttpError(400, "type and title required");
        if (refId !== undefined && refId !== null && refId !== "" && !isValidId(refId)) throw new HttpError(400, "Invalid refId");
        const nextPosition = topic.items.length > 0 ? Math.max(...topic.items.map((item) => item.position || 0)) + 1 : 1;
        topic.items.push({
            type,
            title: requireText(title, "title"),
            content: optionalText(content, "content"),
            link: optionalLink(link),
            refId: refId || null,
            position: nextPosition,
            status: "draft",
        });
        topic.meta.updatedAt = new Date();
        await topic.save();
        return res.json({ success: true, data: topic.items[topic.items.length - 1] });
    } catch (error) {
        return sendError(res, error, "createItem");
    }
};

exports.updateItem = async (req, res) => {
    try {
        assertValidId(req.params.itemId, "item id");
        const { topic, classroom } = await loadTopicContext(req.params.topicId);
        assertStaff(classroom, req.user);
        const item = topic.items.id(req.params.itemId);
        if (!item) throw new HttpError(404, "Item not found");

        const payload = req.body || {};
        if (payload.title !== undefined) item.title = requireText(payload.title, "title");
        if (payload.content !== undefined) item.content = optionalText(payload.content, "content");
        if (payload.link !== undefined) item.link = optionalLink(payload.link);
        if (payload.status !== undefined) item.status = payload.status;
        if (payload.type !== undefined) item.type = payload.type;

        const removeList = parseStringList(payload.removeAttachments, "removeAttachments");
        const { kept, removed } = applyAttachmentRemoval(item.attachments, removeList);
        const newFiles = pickMany(req.files, "attachments");
        if (newFiles.length > MAX_SUBMISSION_FILES) throw new HttpError(400, "Too many attachments");
        const uploaded = await uploadAttachments(newFiles, process.env.FOLDER_NAME || "materials");

        item.attachments = [...kept, ...uploaded];
        item.meta.updatedAt = new Date();
        topic.meta.updatedAt = new Date();
        await topic.save();
        await discardCloudFiles(removed);
        return res.json({ success: true, data: item });
    } catch (error) {
        return sendError(res, error, "updateItem");
    }
};

exports.deleteItem = async (req, res) => {
    try {
        assertValidId(req.params.itemId, "item id");
        const { topic, classroom } = await loadTopicContext(req.params.topicId);
        assertStaff(classroom, req.user);
        const item = topic.items.id(req.params.itemId);
        if (!item) throw new HttpError(404, "Item not found");
        const removedAttachments = [...item.attachments];
        topic.items.pull({ _id: item._id });
        topic.items.forEach((remaining, index) => {
            remaining.position = index + 1;
        });
        topic.meta.updatedAt = new Date();
        await topic.save();
        await discardCloudFiles(removedAttachments);
        return res.json({ success: true, data: { _id: String(item._id) } });
    } catch (error) {
        return sendError(res, error, "deleteItem");
    }
};

exports.reorderItems = async (req, res) => {
    try {
        const { topic, classroom } = await loadTopicContext(req.params.topicId);
        assertStaff(classroom, req.user);
        const order = req.body && req.body.order;
        if (!Array.isArray(order) || order.length > MAX_LIST_LENGTH || !order.every(isValidId)) {
            throw new HttpError(400, "order must be an array of item ids");
        }
        const remaining = new Map(topic.items.map((item) => [String(item._id), item]));
        const reordered = [];
        order.forEach((itemId) => {
            const found = remaining.get(itemId);
            if (found) {
                reordered.push(found);
                remaining.delete(itemId);
            }
        });
        remaining.forEach((item) => reordered.push(item));
        reordered.forEach((item, index) => {
            item.position = index + 1;
        });
        topic.items = reordered;
        topic.meta.updatedAt = new Date();
        await topic.save();
        return res.json({ success: true });
    } catch (error) {
        return sendError(res, error, "reorderItems");
    }
};

exports.toggleItemStatus = async (req, res) => {
    try {
        assertValidId(req.params.itemId, "item id");
        const { topic, classroom } = await loadTopicContext(req.params.topicId);
        assertStaff(classroom, req.user);
        const item = topic.items.id(req.params.itemId);
        if (!item) throw new HttpError(404, "Item not found");
        item.status = item.status === "published" ? "draft" : "published";
        item.meta.updatedAt = new Date();
        topic.meta.updatedAt = new Date();
        await topic.save();
        return res.json({ success: true, data: item });
    } catch (error) {
        return sendError(res, error, "toggleItemStatus");
    }
};

exports.copyItem = async (req, res) => {
    try {
        assertValidId(req.params.itemId, "item id");
        const destTopicId = req.body && req.body.destTopicId;
        assertValidId(destTopicId, "destination topic id");
        const source = await loadTopicContext(req.params.topicId);
        assertStaff(source.classroom, req.user);
        const destination = await loadTopicContext(destTopicId);
        assertStaff(destination.classroom, req.user);

        const item = source.topic.items.id(req.params.itemId);
        if (!item) throw new HttpError(404, "Item not found");

        const destTopic = destination.topic;
        destTopic.items.push({
            type: item.type,
            title: `${item.title} (copy)`,
            content: item.content,
            link: item.link,
            refId: item.refId || null,
            status: "draft",
            position: destTopic.items.length > 0 ? Math.max(...destTopic.items.map((entry) => entry.position || 0)) + 1 : 1,
        });
        destTopic.meta.updatedAt = new Date();
        await destTopic.save();
        return res.json({ success: true, data: destTopic.items[destTopic.items.length - 1] });
    } catch (error) {
        return sendError(res, error, "copyItem");
    }
};

exports.createAssignment = async (req, res) => {
    try {
        const { topic, classroom } = await loadTopicContext(req.params.topicId);
        assertStaff(classroom, req.user);

        const body = req.body || {};
        const title = requireText(body.title, "title");
        const instructions = optionalText(body.description ?? body.instructions, "description");
        const points = parsePoints(body.maxScore ?? body.points, 100);
        const dueDate = parseOptionalDate(body.dueDate, "dueDate");
        const references = optionalText(body.references, "references");
        const targeting = await resolveAssignees(classroom, body.assigneeType, body.assignees);
        const extraClasses = parseIdList(body.classesAssigned ?? body.otherClasses, "classesAssigned");
        const classesAssigned = Array.from(new Set([String(topic.classroom), ...extraClasses]));

        const files = pickMany(req.files, "attachments");
        if (files.length > MAX_SUBMISSION_FILES) throw new HttpError(400, "Too many attachments");
        const attachments = await uploadAttachments(files, process.env.FOLDER_NAME || "assignments");

        const assignment = await Assignment.create({
            topic: topic._id,
            title,
            instructions,
            dueDate: dueDate || null,
            points,
            createdBy: req.user.id,
            attachments,
            publish: parseBoolean(body.publish),
            classesAssigned,
            references,
            lockSubmissions: parseBoolean(body.lockSubmissions),
            ...targeting,
        });

        await Topic.updateOne({ _id: topic._id }, { $inc: { assignmentsCount: 1 } });
        return res.json({ success: true, data: assignment });
    } catch (error) {
        return sendError(res, error, "createAssignment");
    }
};

async function listAssignmentsForViewer(req, res, { publishedOnly }) {
    const { topic, classroom } = await loadTopicContext(req.params.topicId);
    const isStaff = isStaffRole(assertMember(classroom, req.user));
    const filter = { topic: topic._id };
    if (publishedOnly || !isStaff) filter.publish = true;
    const assignments = await Assignment.find(filter).sort({ createdAt: -1 }).lean();
    const visible = isStaff ? assignments : assignments.filter((assignment) => isAssignmentTargetedAt(assignment, req.user.id));
    return res.json({ success: true, data: visible });
}

exports.listAssignmentsByTopic = async (req, res) => {
    try {
        return await listAssignmentsForViewer(req, res, { publishedOnly: false });
    } catch (error) {
        return sendError(res, error, "listAssignmentsByTopic");
    }
};

exports.listPublishedAssignmentsByTopic = async (req, res) => {
    try {
        return await listAssignmentsForViewer(req, res, { publishedOnly: true });
    } catch (error) {
        return sendError(res, error, "listPublishedAssignmentsByTopic");
    }
};

exports.getAssignment = async (req, res) => {
    try {
        const { assignment, classroom } = await loadAssignmentContext(req.params.assignmentId);
        const isStaff = isStaffRole(assertMember(classroom, req.user));
        if (!isStaff) {
            if (!assignment.publish) throw new HttpError(404, "Assignment not found");
            if (!isAssignmentTargetedAt(assignment, req.user.id)) throw new HttpError(403, "This assignment is not assigned to you");
        }
        return res.json({ success: true, data: assignment });
    } catch (error) {
        return sendError(res, error, "getAssignment");
    }
};

exports.updateAssignment = async (req, res) => {
    try {
        const { assignment, classroom } = await loadAssignmentContext(req.params.assignmentId);
        assertStaff(classroom, req.user);
        const payload = req.body || {};

        if (payload.title !== undefined) assignment.title = requireText(payload.title, "title");
        const instructions = payload.description ?? payload.instructions;
        if (instructions !== undefined) assignment.instructions = optionalText(instructions, "description");
        const dueDate = parseOptionalDate(payload.dueDate, "dueDate");
        if (dueDate !== undefined) assignment.dueDate = dueDate;
        const rawPoints = payload.maxScore ?? payload.points;
        if (rawPoints !== undefined) assignment.points = parsePoints(rawPoints, assignment.points);
        if (payload.references !== undefined) assignment.references = optionalText(payload.references, "references");
        if (payload.publish !== undefined) assignment.publish = parseBoolean(payload.publish);
        if (payload.lockSubmissions !== undefined) assignment.lockSubmissions = parseBoolean(payload.lockSubmissions);

        const targeting = await resolveAssignees(classroom, payload.assigneeType, payload.assignees);
        if (targeting.assigneeType !== undefined) assignment.assigneeType = targeting.assigneeType;
        if (targeting.assignees !== undefined) assignment.assignees = targeting.assignees;

        if (payload.classesAssigned !== undefined) {
            assignment.classesAssigned = parseIdList(payload.classesAssigned, "classesAssigned");
        }

        const removeList = parseStringList(payload.removeAttachments, "removeAttachments");
        const { kept, removed } = applyAttachmentRemoval(assignment.attachments, removeList);
        const newFiles = pickMany(req.files, "attachments");
        if (newFiles.length > MAX_SUBMISSION_FILES) throw new HttpError(400, "Too many attachments");
        const uploaded = await uploadAttachments(newFiles, process.env.FOLDER_NAME || "assignments");
        assignment.attachments = [...kept, ...uploaded];

        assignment.updatedAt = new Date();
        await assignment.save();
        await discardCloudFiles(removed);
        return res.json({ success: true, data: assignment });
    } catch (error) {
        return sendError(res, error, "updateAssignment");
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const { assignment, topic, classroom } = await loadAssignmentContext(req.params.assignmentId);
        assertStaff(classroom, req.user);
        await deleteAssignmentsCascade([assignment._id]);
        await Topic.updateOne({ _id: topic._id, assignmentsCount: { $gt: 0 } }, { $inc: { assignmentsCount: -1 } });
        await Topic.updateOne({ _id: topic._id }, { $pull: { items: { refId: assignment._id } } });
        return res.json({ success: true, data: { _id: String(assignment._id) } });
    } catch (error) {
        return sendError(res, error, "deleteAssignment");
    }
};

exports.submitAssignment = async (req, res) => {
    try {
        const { assignment, classroom } = await loadAssignmentContext(req.params.assignmentId);
        const role = assertMember(classroom, req.user);
        if (role !== "member") throw new HttpError(403, "Only students of this classroom can submit");
        if (!assignment.publish) throw new HttpError(404, "Assignment not found");
        if (!isAssignmentTargetedAt(assignment, req.user.id)) throw new HttpError(403, "This assignment is not assigned to you");
        if (assignment.lockSubmissions) throw new HttpError(403, "Submissions have been locked by the instructor");
        if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
            throw new HttpError(403, "Submission window has closed (due date passed)");
        }

        const body = req.body || {};
        const content = optionalText(body.content, "content");
        const removeList = parseStringList(body.removeAttachments ?? body.remove, "removeAttachments");
        const newFiles = pickMany(req.files, "attachments");
        if (newFiles.length > MAX_SUBMISSION_FILES) throw new HttpError(400, "Too many attachments");

        const existing = await Submission.findOne({ assignment: assignment._id, student: req.user.id });
        if (existing && existing.grade !== null) throw new HttpError(409, "A graded submission can no longer be changed");
        if (!existing && !content.trim() && newFiles.length === 0) throw new HttpError(400, "Submission is empty");

        const uploaded = await uploadAttachments(newFiles, process.env.FOLDER_NAME || "submissions");

        if (!existing) {
            const created = await Submission.create({
                assignment: assignment._id,
                student: req.user.id,
                content,
                attachments: uploaded,
            });
            return res.json({ success: true, data: created });
        }

        const { kept, removed } = applyAttachmentRemoval(existing.attachments, removeList);
        existing.attachments = [...kept, ...uploaded];
        existing.content = content || existing.content;
        existing.submittedAt = new Date();
        await existing.save();
        await discardCloudFiles(removed);
        return res.json({ success: true, data: existing });
    } catch (error) {
        return sendError(res, error, "submitAssignment");
    }
};

exports.getMySubmission = async (req, res) => {
    try {
        const { assignment, classroom } = await loadAssignmentContext(req.params.assignmentId);
        assertMember(classroom, req.user);
        const submission = await Submission.findOne({ assignment: assignment._id, student: req.user.id }).lean();
        return res.json({ success: true, data: submission || null });
    } catch (error) {
        return sendError(res, error, "getMySubmission");
    }
};

exports.getSubmissions = async (req, res) => {
    try {
        const { assignment, classroom } = await loadAssignmentContext(req.params.assignmentId);
        assertStaff(classroom, req.user);
        const submissions = await Submission.find({ assignment: assignment._id })
            .populate("student", USER_PUBLIC_FIELDS)
            .sort({ submittedAt: -1 })
            .lean();
        return res.json({ success: true, data: submissions });
    } catch (error) {
        return sendError(res, error, "getSubmissions");
    }
};

exports.updateSubmission = async (req, res) => {
    try {
        assertValidId(req.params.submissionId, "submission id");
        const { assignment, classroom } = await loadAssignmentContext(req.params.assignmentId);
        assertStaff(classroom, req.user);

        const submission = await Submission.findOne({ _id: req.params.submissionId, assignment: assignment._id });
        if (!submission) throw new HttpError(404, "Submission not found");

        const payload = req.body || {};
        let changed = false;
        if (payload.grade !== undefined) {
            const { grade } = payload;
            if (grade === null || grade === "") {
                submission.grade = null;
            } else {
                const isNumeric = typeof grade === "number" || (typeof grade === "string" && grade.trim() !== "");
                const numericGrade = isNumeric ? Number(grade) : NaN;
                if (!Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > assignment.points) {
                    throw new HttpError(400, `grade must be a number between 0 and ${assignment.points}`);
                }
                submission.grade = numericGrade;
            }
            changed = true;
        }
        if (payload.feedback !== undefined) {
            submission.feedback = optionalText(payload.feedback, "feedback", 5000);
            changed = true;
        }
        if (changed) {
            submission.gradedBy = req.user.id;
            submission.gradedAt = new Date();
            await submission.save();
        }

        const populated = await Submission.findById(submission._id)
            .populate("student", USER_PUBLIC_FIELDS)
            .populate("gradedBy", "firstName lastName email")
            .lean();
        return res.json({ success: true, data: populated });
    } catch (error) {
        return sendError(res, error, "updateSubmission");
    }
};

exports.createQuiz = async (req, res) => {
    try {
        const { topic, classroom } = await loadTopicContext(req.params.topicId);
        assertStaff(classroom, req.user);
        const { title, description, timeLimit, shuffle } = req.body || {};
        const quiz = await Quiz.create({
            topic: topic._id,
            title: requireText(title, "title"),
            description: optionalText(description, "description"),
            timeLimit: parsePoints(timeLimit, 0),
            shuffle: parseBoolean(shuffle),
            createdBy: req.user.id,
        });
        return res.json({ success: true, data: quiz });
    } catch (error) {
        return sendError(res, error, "createQuiz");
    }
};

exports.getQuiz = async (req, res) => {
    try {
        const { quiz, classroom } = await loadQuizContext(req.params.quizId);
        const isStaff = isStaffRole(assertMember(classroom, req.user));
        if (!isStaff && !quiz.publish) throw new HttpError(404, "Quiz not found");
        return res.json({ success: true, data: await viewQuizForUser(quiz, req.user.id, isStaff) });
    } catch (error) {
        return sendError(res, error, "getQuiz");
    }
};

exports.updateQuiz = async (req, res) => {
    try {
        const { quiz, classroom } = await loadQuizContext(req.params.quizId);
        assertStaff(classroom, req.user);
        const payload = req.body || {};
        if (payload.title !== undefined) quiz.title = requireText(payload.title, "title");
        if (payload.description !== undefined) quiz.description = optionalText(payload.description, "description");
        if (payload.timeLimit !== undefined) quiz.timeLimit = parsePoints(payload.timeLimit, 0);
        if (payload.shuffle !== undefined) quiz.shuffle = parseBoolean(payload.shuffle);
        if (payload.publish !== undefined) quiz.publish = parseBoolean(payload.publish);
        quiz.meta.updatedAt = new Date();
        await quiz.save();
        return res.json({ success: true, data: quiz });
    } catch (error) {
        return sendError(res, error, "updateQuiz");
    }
};

async function listQuizzesForViewer(req, res, { publishedOnly }) {
    const { topic, classroom } = await loadTopicContext(req.params.topicId);
    const isStaff = isStaffRole(assertMember(classroom, req.user));
    const filter = { topic: topic._id };
    if (publishedOnly || !isStaff) filter.publish = true;
    const quizzes = await Quiz.find(filter).sort({ "meta.createdAt": -1 }).lean();
    const data = isStaff ? quizzes : quizzes.map(stripQuizAnswerKeys);
    return res.json({ success: true, data });
}

exports.listQuizzesByTopic = async (req, res) => {
    try {
        return await listQuizzesForViewer(req, res, { publishedOnly: false });
    } catch (error) {
        return sendError(res, error, "listQuizzesByTopic");
    }
};

exports.listPublishedQuizzesByTopic = async (req, res) => {
    try {
        return await listQuizzesForViewer(req, res, { publishedOnly: true });
    } catch (error) {
        return sendError(res, error, "listPublishedQuizzesByTopic");
    }
};

exports.deleteQuiz = async (req, res) => {
    try {
        const { quiz, topic, classroom } = await loadQuizContext(req.params.quizId);
        assertStaff(classroom, req.user);
        await deleteQuizzesCascade([quiz._id]);
        await Topic.updateOne({ _id: topic._id }, { $pull: { items: { refId: quiz._id } } });
        return res.json({ success: true, data: { _id: String(quiz._id) } });
    } catch (error) {
        return sendError(res, error, "deleteQuiz");
    }
};

function parseScreenOptions(options) {
    if (!Array.isArray(options) || options.length > 100) throw new HttpError(400, "Invalid options");
    return options.map((option) => {
        if (!option || typeof option !== "object") throw new HttpError(400, "Invalid options");
        return { text: optionalText(option.text === undefined ? "" : String(option.text), "option text", 2000), correct: parseBoolean(option.correct) };
    });
}

function parseScreenProperties(properties) {
    if (!properties || typeof properties !== "object" || Array.isArray(properties)) throw new HttpError(400, "Invalid properties");
    const parsed = {};
    if (properties.timeLimit !== undefined) parsed.timeLimit = parsePoints(properties.timeLimit, 0);
    if (properties.points !== undefined) parsed.points = parsePoints(properties.points, 1);
    if (properties.answerMode !== undefined) parsed.answerMode = properties.answerMode;
    return parsed;
}

exports.createScreen = async (req, res) => {
    try {
        const { quiz, classroom } = await loadQuizContext(req.params.quizId);
        assertStaff(classroom, req.user);
        const { type, body, options, properties } = req.body || {};
        if (!isNonEmptyString(type)) throw new HttpError(400, "type required");
        const nextPosition = quiz.screens.length > 0 ? Math.max(...quiz.screens.map((screen) => screen.position || 0)) + 1 : 1;
        quiz.screens.push({
            type,
            body: optionalText(body, "body"),
            options: options === undefined ? [] : parseScreenOptions(options),
            properties: properties === undefined ? {} : parseScreenProperties(properties),
            position: nextPosition,
            status: "draft",
        });
        quiz.meta.updatedAt = new Date();
        await quiz.save();
        return res.json({ success: true, data: quiz.screens[quiz.screens.length - 1] });
    } catch (error) {
        return sendError(res, error, "createScreen");
    }
};

exports.updateScreen = async (req, res) => {
    try {
        const { quiz, classroom } = await loadScreenContext(req.params.screenId);
        assertStaff(classroom, req.user);
        const screen = quiz.screens.id(req.params.screenId);
        if (!screen) throw new HttpError(404, "Screen not found");
        const payload = req.body || {};
        if (payload.body !== undefined) screen.body = optionalText(payload.body, "body");
        if (payload.type !== undefined) screen.type = payload.type;
        if (payload.status !== undefined) screen.status = payload.status;
        if (payload.options !== undefined) screen.options = parseScreenOptions(payload.options);
        if (payload.properties !== undefined) {
            Object.entries(parseScreenProperties(payload.properties)).forEach(([key, value]) => {
                screen.set(`properties.${key}`, value);
            });
        }
        screen.meta.updatedAt = new Date();
        quiz.meta.updatedAt = new Date();
        await quiz.save();
        return res.json({ success: true, data: screen });
    } catch (error) {
        return sendError(res, error, "updateScreen");
    }
};

exports.deleteScreen = async (req, res) => {
    try {
        assertValidId(req.params.screenId, "screen id");
        const { quiz, classroom } = await loadQuizContext(req.params.quizId);
        assertStaff(classroom, req.user);
        if (!quiz.screens.id(req.params.screenId)) throw new HttpError(404, "Screen not found");
        quiz.screens.pull({ _id: req.params.screenId });
        quiz.screens.forEach((screen, index) => {
            screen.position = index + 1;
        });
        quiz.meta.updatedAt = new Date();
        await quiz.save();
        return res.json({ success: true, data: quiz });
    } catch (error) {
        return sendError(res, error, "deleteScreen");
    }
};

exports.reorderScreens = async (req, res) => {
    try {
        const { quiz, classroom } = await loadQuizContext(req.params.quizId);
        assertStaff(classroom, req.user);
        const order = req.body && req.body.order;
        if (!Array.isArray(order) || order.length > MAX_LIST_LENGTH || !order.every(isValidId)) {
            throw new HttpError(400, "order must be an array of screen ids");
        }
        const remaining = new Map(quiz.screens.map((screen) => [String(screen._id), screen]));
        const reordered = [];
        order.forEach((screenId) => {
            const found = remaining.get(screenId);
            if (found) {
                reordered.push(found);
                remaining.delete(screenId);
            }
        });
        remaining.forEach((screen) => reordered.push(screen));
        reordered.forEach((screen, index) => {
            screen.position = index + 1;
        });
        quiz.screens = reordered;
        quiz.meta.updatedAt = new Date();
        await quiz.save();
        return res.json({ success: true });
    } catch (error) {
        return sendError(res, error, "reorderScreens");
    }
};

function isValidProvidedAnswer(provided) {
    if (provided === undefined || provided === null) return true;
    if (typeof provided === "string") return provided.length <= 2000;
    if (typeof provided === "number" || typeof provided === "boolean") return true;
    return Array.isArray(provided) && provided.length <= 100 && provided.every((entry) => typeof entry === "string" || typeof entry === "number");
}

exports.submitAttempt = async (req, res) => {
    try {
        const { quiz, classroom } = await loadQuizContext(req.params.quizId);
        const role = assertMember(classroom, req.user);
        if (!quiz.publish && !isStaffRole(role)) throw new HttpError(403, "Quiz is not published");

        const payload = req.body || {};
        if (payload.answers !== undefined && (!Array.isArray(payload.answers) || payload.answers.length > MAX_ANSWERS_PER_REQUEST)) {
            throw new HttpError(400, "answers must be an array");
        }
        const incoming = payload.answers || [];
        for (const answer of incoming) {
            if (!answer || typeof answer !== "object" || !isValidId(answer.screenId) || !isValidProvidedAnswer(answer.provided)) {
                throw new HttpError(400, "Invalid answer payload");
            }
        }

        let attempt = await Attempt.findOne({ quiz: quiz._id, user: req.user.id });
        if (attempt && attempt.finishedAt) throw new HttpError(409, "Attempt already finished");
        const isFirstSubmission = !attempt;
        if (!attempt) attempt = new Attempt({ quiz: quiz._id, user: req.user.id });

        const now = new Date();
        const lastActivity = isFirstSubmission ? now : new Date(attempt.meta.updatedAt || attempt.startedAt);
        const screensById = new Map(quiz.screens.map((screen) => [String(screen._id), screen.toObject()]));
        const answeredIds = new Set(attempt.answers.map((answer) => String(answer.screenId)));

        const newAnswers = [];
        for (const answer of incoming) {
            const screenId = String(answer.screenId);
            if (!screensById.has(screenId) || answeredIds.has(screenId)) continue;
            answeredIds.add(screenId);
            newAnswers.push(answer);
        }

        const elapsedSeconds = Math.max(0, (now - lastActivity) / 1000);
        const sharedElapsed = newAnswers.length > 0 ? elapsedSeconds / newAnswers.length : 0;
        for (const answer of newAnswers) {
            const screen = screensById.get(String(answer.screenId));
            const screenLimit = Number(screen.properties?.timeLimit) || quiz.timeLimit || Infinity;
            const claimedSeconds = Math.max(0, Number(answer.timeTaken) || 0);
            const timeTaken = Math.min(isFirstSubmission ? claimedSeconds : sharedElapsed, screenLimit);
            const evaluation = evaluateScreenAnswer(screen, answer.provided, timeTaken);
            attempt.answers.push({
                screenId: new mongoose.Types.ObjectId(String(answer.screenId)),
                provided: answer.provided,
                correct: evaluation.correct,
                points: evaluation.pointsEarned,
                basePoints: evaluation.base,
                timeTaken: evaluation.timeTaken,
                timeBonus: evaluation.timeBonus,
            });
        }

        attempt.totalPoints = attempt.answers.reduce((sum, answer) => sum + (answer.points || 0), 0);
        if (parseBoolean(payload.finish)) attempt.finishedAt = now;
        attempt.meta.updatedAt = now;
        await attempt.save();

        return res.json({ success: true, data: attempt });
    } catch (error) {
        return sendError(res, error, "submitAttempt");
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const { quiz, classroom } = await loadQuizContext(req.params.quizId);
        const isStaff = isStaffRole(assertMember(classroom, req.user));
        if (!isStaff && !quiz.publish) throw new HttpError(404, "Quiz not found");

        const rows = await Attempt.aggregate([
            { $match: { quiz: quiz._id } },
            { $sort: { totalPoints: -1, finishedAt: 1 } },
            { $group: { _id: "$user", bestScore: { $max: "$totalPoints" }, lastAttemptAt: { $first: "$finishedAt" } } },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
                    score: "$bestScore",
                    lastAttemptAt: 1,
                },
            },
            { $sort: { score: -1, lastAttemptAt: 1 } },
        ]).allowDiskUse(true);

        const board = rows.map((row, index) => ({
            id: String(row.userId),
            name: row.name || "Unknown",
            score: row.score || 0,
            rank: index + 1,
        }));
        const me = board.find((entry) => entry.id === String(req.user.id)) || null;

        return res.json({ success: true, data: { board, me } });
    } catch (error) {
        return sendError(res, error, "getLeaderboard");
    }
};
