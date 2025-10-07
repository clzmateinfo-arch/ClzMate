const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const sessionSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    title: { type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    externalUrl: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});
module.exports = createModel("ClassroomSession", sessionSchema);
