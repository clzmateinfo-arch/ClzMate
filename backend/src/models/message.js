const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const messageSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    content: { type: String, default: "" },
    attachments: [{ url: String, originalName: String }],
    createdAt: { type: Date, default: Date.now },
});
module.exports = createModel("Message", messageSchema);
