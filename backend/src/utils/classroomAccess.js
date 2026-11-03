const mongoose = require("mongoose");
const Classroom = require("../models/classroom");
const Topic = require("../models/topic");
const Assignment = require("../models/assignment");
const Quiz = require("../models/quiz");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const STAFF_ROLES = new Set(["owner", "coInstructor", "admin"]);

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const isValidId = (value) => typeof value === "string" && OBJECT_ID_PATTERN.test(value);

const toIdString = (value) => String(value && value._id ? value._id : value);

function assertValidId(value, label = "id") {
    if (!isValidId(value)) throw new HttpError(400, `Invalid ${label}`);
}

function sendError(res, error, label) {
    if (error instanceof HttpError) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    if (error && error.code === 11000) {
        return res.status(409).json({ success: false, message: "Duplicate resource" });
    }
    if (error && (error.name === "ValidationError" || error.name === "CastError")) {
        return res.status(400).json({ success: false, message: "Invalid input" });
    }
    console.error(label, error);
    return res.status(500).json({ success: false, message: "Internal server error" });
}

function getRoleInClassroom(classroom, userId) {
    if (!classroom || !userId) return null;
    const userKey = String(userId);
    if (toIdString(classroom.owner) === userKey) return "owner";
    if ((classroom.coInstructors || []).some((id) => toIdString(id) === userKey)) return "coInstructor";

    const membership = (classroom.members || []).find((entry) => toIdString(entry.user) === userKey);
    if (membership) {
        if (membership.temporaryUntil && new Date(membership.temporaryUntil) < new Date()) return null;
        if (membership.role === "Instructor" || membership.role === "CoInstructor") return "coInstructor";
        if (membership.role === "Guest") return "guest";
        return "member";
    }
    if ((classroom.guests || []).some((id) => toIdString(id) === userKey)) return "guest";
    return null;
}

const isAdminUser = (user) => user?.accountType === "Admin";

function resolveRole(classroom, user) {
    if (isAdminUser(user)) return "admin";
    return getRoleInClassroom(classroom, user?.id);
}

function assertMember(classroom, user) {
    const role = resolveRole(classroom, user);
    if (!role) throw new HttpError(403, "You are not a member of this classroom");
    return role;
}

function assertStaff(classroom, user) {
    const role = resolveRole(classroom, user);
    if (!STAFF_ROLES.has(role)) throw new HttpError(403, "Only classroom staff can perform this action");
    return role;
}

const isStaffRole = (role) => STAFF_ROLES.has(role);

async function loadClassroomOrFail(classroomId) {
    assertValidId(classroomId, "classroom id");
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) throw new HttpError(404, "Classroom not found");
    return classroom;
}

async function loadTopicContext(topicId) {
    assertValidId(topicId, "topic id");
    const topic = await Topic.findById(topicId);
    if (!topic) throw new HttpError(404, "Topic not found");
    const classroom = await Classroom.findById(topic.classroom);
    if (!classroom) throw new HttpError(404, "Classroom not found");
    return { topic, classroom };
}

async function loadAssignmentContext(assignmentId) {
    assertValidId(assignmentId, "assignment id");
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new HttpError(404, "Assignment not found");
    const { topic, classroom } = await loadTopicContext(String(assignment.topic));
    return { assignment, topic, classroom };
}

async function loadQuizContext(quizId) {
    assertValidId(quizId, "quiz id");
    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw new HttpError(404, "Quiz not found");
    const { topic, classroom } = await loadTopicContext(String(quiz.topic));
    return { quiz, topic, classroom };
}

async function loadScreenContext(screenId) {
    assertValidId(screenId, "screen id");
    const quiz = await Quiz.findOne({ "screens._id": new mongoose.Types.ObjectId(screenId) });
    if (!quiz) throw new HttpError(404, "Screen not found");
    const { topic, classroom } = await loadTopicContext(String(quiz.topic));
    return { quiz, topic, classroom };
}

function isAssignmentTargetedAt(assignment, userId) {
    if (assignment.assigneeType !== "selected") return true;
    return (assignment.assignees || []).some((id) => String(id) === String(userId));
}

const toPublicUser = (user) => {
    if (!user || typeof user !== "object" || !user._id) return user;
    return { _id: user._id, firstName: user.firstName, lastName: user.lastName, image: user.image };
};

function serializeClassroomForViewer(classroom, isStaff) {
    const plain = typeof classroom.toObject === "function" ? classroom.toObject() : { ...classroom };
    if (isStaff) return plain;
    delete plain.inviteCode;
    plain.owner = toPublicUser(plain.owner);
    plain.members = (plain.members || []).map((entry) => ({ ...entry, user: toPublicUser(entry.user) }));
    return plain;
}

module.exports = {
    HttpError,
    isValidId,
    assertValidId,
    sendError,
    getRoleInClassroom,
    resolveRole,
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
};
