const mongoose = require("mongoose");
const Course = require("../models/course");
const RatingAndReview = require("../models/ratingAndReview");
const { isObjectId, sendServerError } = require("../utils/validators");

const MAX_REVIEW_LENGTH = 2000;
const MAX_REVIEWS_PER_REQUEST = 100;

exports.createRating = async (req, res) => {
  try {
    const { rating, review, courseId } = req.body || {};
    const userId = req.user.id;

    const numericRating = typeof rating === "string" && rating.trim() === "" ? NaN : Number(rating);
    const isReviewValid = typeof review === "string" && review.trim().length > 0 && review.length <= MAX_REVIEW_LENGTH;

    if (!isObjectId(courseId) || !isReviewValid || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "courseId, an integer rating between 1 and 5, and a review are required",
      });
    }

    const course = await Course.findOne({ _id: courseId, studentsEnrolled: userId }).select("_id");
    if (!course) {
      return res.status(403).json({ success: false, message: "Student is not enrolled in the course" });
    }

    if (await RatingAndReview.exists({ course: courseId, user: userId })) {
      return res.status(409).json({ success: false, message: "Course is already reviewed by the user" });
    }

    let ratingReview;
    try {
      ratingReview = await RatingAndReview.create({ user: userId, course: courseId, rating: numericRating, review: review.trim() });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({ success: false, message: "Course is already reviewed by the user" });
      }
      throw error;
    }

    await Course.updateOne({ _id: courseId }, { $addToSet: { ratingAndReviews: ratingReview._id } });

    return res.status(200).json({
      success: true,
      data: ratingReview,
      message: "Rating and Review created Successfully",
    });
  } catch (error) {
    return sendServerError(res, "Error while creating rating and review", error, "Error while creating rating and review");
  }
};

exports.getAverageRating = async (req, res) => {
  try {
    const { courseId } = req.query;

    if (!isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: "Valid courseId is required" });
    }

    const [result] = await RatingAndReview.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } },
    ]);

    if (result) {
      return res.status(200).json({ success: true, averageRating: result.averageRating });
    }

    return res.status(200).json({
      success: true,
      message: "Average Rating is 0, no ratings given till now",
      averageRating: 0,
    });
  } catch (error) {
    return sendServerError(res, "getAverageRating error", error, "Error while calculating average rating");
  }
};

exports.getAllRatingReview = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || MAX_REVIEWS_PER_REQUEST, 1), MAX_REVIEWS_PER_REQUEST);

    const allReviews = await RatingAndReview.find({})
      .sort({ rating: "desc" })
      .limit(limit)
      .populate({ path: "user", select: "firstName lastName image" })
      .populate({ path: "course", select: "courseName" })
      .exec();

    return res.status(200).json({
      success: true,
      data: allReviews,
      message: "All reviews fetched successfully",
    });
  } catch (error) {
    return sendServerError(res, "Error while fetching all ratings", error, "Error while fetching all ratings");
  }
};
