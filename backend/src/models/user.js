const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        preferredName: {
            type: String,
            required: true,
            trim: true,
        },
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        accountType: {
            type: String,
            enum: ["Admin", "Instructor", "Student"],
            reuired: true,
        },
        active: {
            type: Boolean,
            default: true,
        },
        approved: {
            type: Boolean,
            default: true,
        },
        additionalDetails: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true,
        },
        courses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
        ],
        image: {
            type: String,
            required: true,
        },
        token: {
            type: String,
        },
        resetPasswordTokenExpires: {
            type: Date,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        courseProgress: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "CourseProgress",
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
