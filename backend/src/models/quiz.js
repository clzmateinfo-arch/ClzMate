const mongoose = require("mongoose");
const createModel = require("../utils/createModel");

const screenSchema = new mongoose.Schema({
    type: { type: String, enum: ["multiple", "truefalse", "short", "slider", "poll", "puzzle"], required: true },
    body: { type: String, default: "" },
    options: [{ text: String, correct: { type: Boolean, default: false } }],
    properties: {
        timeLimit: { type: Number, default: 0 },
        points: { type: Number, default: 1 },
        answerMode: { type: String, enum: ["single", "multiple"], default: "single" }
    },
    position: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    meta: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }
});

const quizSchema = new mongoose.Schema({
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    timeLimit: { type: Number, default: 0 },
    shuffle: { type: Boolean, default: false },
    screens: { type: [screenSchema], default: [] },
    publish: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    meta: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }
});

module.exports = createModel("Quiz", quizSchema);
