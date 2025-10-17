const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const assignmentSchema = new mongoose.Schema({
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
    title: { type: String, required: true },
    instructions: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, default: null },
    points: { type: Number, default: 100 },
    attachments: [
        {
            url: String,
            publicId: String,
            originalName: String,
            mimeType: String,
            size: Number,
            resourceType: String,
        }
    ],
    publish: { type: Boolean, default: false },
    assigneeType: { type: String, enum: ["all", "selected"], default: "all" },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    classesAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }],
    references: { type: String, default: "" },
    lockSubmissions: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = createModel("Assignment", assignmentSchema);
