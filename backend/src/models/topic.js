const mongoose = require("mongoose");
const createModel = require("../utils/createModel");

const attachmentSchema = new mongoose.Schema({
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    resourceType: { type: String, default: "" },
});

const itemSchema = new mongoose.Schema({
    type: { type: String, enum: ["assignment", "quiz", "material", "subsection", "copied"], required: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    link: { type: String, default: "" },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    position: { type: Number, default: 0 },
    attachments: { type: [attachmentSchema], default: [] },
    meta: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
});

const topicSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    position: { type: Number, default: 0 },
    items: { type: [itemSchema], default: [] },
    assignmentsCount: { type: Number, default: 0 },
    meta: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
});

module.exports = createModel("Topic", topicSchema);
