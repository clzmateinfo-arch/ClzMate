const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const ratingAndReviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    review: {
        type: String,
        required: true,
        maxlength: 2000,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Course",
        index: true,
    },
});

ratingAndReviewSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = createModel("RatingAndReview", ratingAndReviewSchema);
