const mongoose = require("mongoose");
const createModel = require("../utils/createModel");

const answerSchema = new mongoose.Schema({
    screenId: { type: mongoose.Schema.Types.ObjectId, required: true },
    provided: { type: mongoose.Schema.Types.Mixed },
    correct: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    basePoints: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    timeBonus: { type: Number, default: 0 }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [answerSchema], default: [] },
    totalPoints: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
    meta: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }
});

module.exports = createModel("Attempt", attemptSchema);
