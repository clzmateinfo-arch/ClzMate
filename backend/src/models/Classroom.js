const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const memberSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["Instructor", "CoInstructor", "Student", "Guest"], default: "Student" },
    addedAt: { type: Date, default: Date.now },
    temporaryUntil: { type: Date, default: null },
});

const classroomSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inviteCode: { type: String, required: true, unique: true },
    members: { type: [memberSchema], default: [] },
    CoInstructors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    guests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    meta: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
});

module.exports = createModel("Classroom", classroomSchema);
