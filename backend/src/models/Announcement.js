const mongoose = require("mongoose");
const announcementSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    pinned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Announcement", announcementSchema);
