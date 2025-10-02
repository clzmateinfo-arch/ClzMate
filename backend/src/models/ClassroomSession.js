const mongoose = require("mongoose");
const sessionSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    title: { type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    externalUrl: { type: String, default: null }, // zoom / teams link
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("ClassroomSession", sessionSchema);
