const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const topicSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    materials: [
        {
            type: { type: String, enum: ["file", "link", "subsection"], default: "link" },
            title: String,
            url: String,
            courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
            sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
            subSectionId: { type: mongoose.Schema.Types.ObjectId, ref: "SubSection" },
        },
    ],
    assignmentsCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

module.exports = createModel('User', topicSchema);
