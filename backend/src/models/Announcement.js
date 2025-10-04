const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const announcementSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    pinned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = createModel("Announcement", announcementSchema);
