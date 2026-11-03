const Category = require("../models/category");
const Course = require("../models/course");
const { isObjectId, sendServerError } = require("../utils/validators");

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MOST_ENROLLED_LIMIT = 10;
const PUBLIC_COURSE_EXCLUSIONS = "-enrollmentRequests";

const isBoundedText = (value, maxLength) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body || {};

    if (!isBoundedText(name, MAX_NAME_LENGTH) || !isBoundedText(description, MAX_DESCRIPTION_LENGTH)) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    await Category.create({ name: name.trim(), description: description.trim() });

    return res.status(200).json({ success: true, message: "Category created successfully" });
  } catch (error) {
    return sendServerError(res, "Error while creating Category", error, "Error while creating Category");
  }
};

exports.showAllCategories = async (req, res) => {
  try {
    const allCategories = await Category.find({}, { name: true, description: true });

    return res.status(200).json({
      success: true,
      data: allCategories,
      message: "All allCategories fetched successfully",
    });
  } catch (error) {
    return sendServerError(res, "Error while fetching all allCategories", error, "Error while fetching all allCategories");
  }
};

exports.getCategoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body || {};

    if (!isObjectId(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid categoryId" });
    }

    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
        select: PUBLIC_COURSE_EXCLUSIONS,
        populate: [
          { path: "ratingAndReviews" },
          { path: "instructor", select: "firstName lastName preferredName image" },
          { path: "category", select: "name" },
        ],
      })
      .exec();

    if (!selectedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (selectedCategory.courses.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "No courses found for the selected category.",
      });
    }

    const mostEnrolled = await Course.aggregate([
      { $match: { status: "Published" } },
      { $addFields: { enrolledCount: { $size: { $ifNull: ["$studentsEnrolled", []] } } } },
      { $sort: { enrolledCount: -1, createdAt: -1 } },
      { $limit: MOST_ENROLLED_LIMIT },
      { $project: { enrollmentRequests: 0 } },
    ]);
    const mostSellingCourses = await Course.populate(mostEnrolled, {
      path: "instructor",
      select: "firstName lastName preferredName image",
    });

    return res.status(200).json({
      success: true,
      data: { selectedCategory, mostSellingCourses },
    });
  } catch (error) {
    return sendServerError(res, "Error while getting the caregories: ", error, "Internal server error");
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryId, name, description } = req.body || {};
    if (!isObjectId(categoryId)) return res.status(400).json({ success: false, message: "Valid categoryId required" });

    const update = {};
    if (name !== undefined) {
      if (!isBoundedText(name, MAX_NAME_LENGTH)) return res.status(400).json({ success: false, message: "Invalid name" });
      update.name = name.trim();
    }
    if (description !== undefined) {
      if (!isBoundedText(description, MAX_DESCRIPTION_LENGTH)) {
        return res.status(400).json({ success: false, message: "Invalid description" });
      }
      update.description = description.trim();
    }

    const updated = await Category.findByIdAndUpdate(categoryId, update, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Category not found" });
    return res.status(200).json({ success: true, data: updated, message: "Category updated" });
  } catch (error) {
    return sendServerError(res, "updateCategory", error, "Error while updating category");
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body || {};
    if (!isObjectId(categoryId)) return res.status(400).json({ success: false, message: "Valid categoryId required" });

    if (await Course.exists({ category: categoryId })) {
      return res.status(409).json({ success: false, message: "Category still has courses and cannot be deleted" });
    }

    const deleted = await Category.findByIdAndDelete(categoryId).lean();
    if (!deleted) return res.status(404).json({ success: false, message: "Category not found" });
    return res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    return sendServerError(res, "deleteCategory", error, "Error while deleting category");
  }
};
