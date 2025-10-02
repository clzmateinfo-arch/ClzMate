const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: false },
    subSectionId: { type: mongoose.Schema.Types.ObjectId, ref: "SubSection", required: false },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", NoteSchema);
