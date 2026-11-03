const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const submissionSchema = new mongoose.Schema({
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    attachments: [{
        url: String,
        publicId: String,
        originalName: String,
        mimeType: String,
        size: Number,
        resourceType: String,
    }],
    submittedAt: { type: Date, default: Date.now },
    grade: { type: Number, default: null },
    feedback: { type: String, default: "" },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    gradedAt: { type: Date, default: null },
});

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = createModel("Submission", submissionSchema);
