const mongoose = require("mongoose");

const supportMaterialSchema = new mongoose.Schema({
    url: { type: String },
    publicId: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    resourceType: { type: String },
    isMainVideo: { type: Boolean, default: false },
    isMainPdf: { type: Boolean, default: false },
});

const subSectionSchema = new mongoose.Schema(
    {
        title: { type: String, trim: true, default: "" },
        timeDuration: { type: Number, default: 0 },
        description: { type: String, default: "" },
        supportMaterials: {
            type: [supportMaterialSchema],
            default: [],
        },
        externalVideoUrl: { type: String, default: null },

        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SubSection", subSectionSchema);
