const mongoose = require("mongoose");

const subSectionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            default: "",
        },

        timeDuration: {
            type: Number,
            default: 0,
        },

        description: {
            type: String,
            default: "",
        },

        videoUrl: {
            type: String,
            default: null,
        },
        pdfUrl: {
            type: String,
            default: null,
        },

        videoPublicId: {
            type: String,
            default: null,
        },
        pdfPublicId: {
            type: String,
            default: null,
        },

        supportMaterials: {
            type: [
                {
                    url: { type: String },
                    publicId: { type: String },
                    originalName: { type: String },
                    mimeType: { type: String },
                    size: { type: Number },
                },
            ],
            default: [],
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SubSection", subSectionSchema);
