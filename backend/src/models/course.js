const mongoose = require("mongoose");

const enrollmentRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
    responder: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, default: "" },
});

const courseSchema = new mongoose.Schema({
    courseName: { type: String },
    courseDescription: { type: String },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    whatYouWillLearn: { type: String },
    courseContent: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],
    ratingAndReviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "RatingAndReview" }],
    price: { type: Number },
    thumbnail: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tag: { type: [String], required: true },
    studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    instructions: { type: [String] },
    features: {
        type: {
            sandboxEnabled: { type: Boolean, default: false },
            sandboxLanguage: { type: String, default: "javascript" },
            notesEnabled: { type: Boolean, default: true },
        },
        default: { sandboxEnabled: false, sandboxLanguage: "javascript", notesEnabled: true },
    },
    status: { type: String, enum: ["Draft", "Published"] },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    requiresApproval: { type: Boolean, default: false },
    enrollmentRequests: {
        type: [enrollmentRequestSchema],
        default: [],
    },
});

module.exports = mongoose.model("Course", courseSchema);
