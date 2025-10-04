const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const assignmentSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    title: { type: String, required: true },
    instructions: { type: String, default: "" },
    relatedLecture: { type: mongoose.Schema.Types.ObjectId, ref: "SubSection", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, default: null },
    points: { type: Number, default: 100 },
    attachments: [{
        url: String,
        originalName: String,
        mimeType: String,
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = createModel("Assignment", assignmentSchema);
