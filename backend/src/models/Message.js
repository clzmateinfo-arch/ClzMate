const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    content: { type: String, default: "" },
    attachments: [{ url: String, originalName: String }],
    createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Message", messageSchema);
