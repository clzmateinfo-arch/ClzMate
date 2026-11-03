const mongoose = require("mongoose");
const Course = require("../models/course");
const User = require("../models/user");
const Category = require("../models/category");
const Note = require("../models/note");
const CourseProgress = require("../models/courseProgress");
const { uploadFileToCloudinary } = require("../utils/fileUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
const { canManageCourse, isEnrolledOrOwner } = require("../utils/courseAccess");
const { deleteCourseWithDependents } = require("../utils/courseCleanup");
const { completeEnrollment, createEnrollmentRequest } = require("../utils/enrollment");
const mailSender = require("../utils/mailSender");
const { escapeHtml, isObjectId, buildSearchRegex, sendServerError } = require("../utils/validators");

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_LIST_ITEMS = 50;
const MAX_LIST_ITEM_LENGTH = 300;
const MAX_NOTE_LENGTH = 20000;
const SAFE_INSTRUCTOR_FIELDS = "firstName lastName preferredName image additionalDetails";
const DEFAULT_FEATURES = { sandboxEnabled: false, sandboxLanguage: "javascript", notesEnabled: true };
const MAX_SANDBOX_LANGUAGE_LENGTH = 30;

const instructorPopulation = {
  path: "instructor",
  select: SAFE_INSTRUCTOR_FIELDS,
  populate: { path: "additionalDetails", select: "about" },
};

const contentPopulation = { path: "courseContent", populate: { path: "subSection" } };

const isBoundedText = (value, maxLength) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;

const parseMaybeJson = (raw) => {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const parseStringList = (raw) => {
  const parsed = parseMaybeJson(raw);
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_LIST_ITEMS) return null;
  const isValid = parsed.every((item) => typeof item === "string" && item.trim() && item.length <= MAX_LIST_ITEM_LENGTH);
  return isValid ? parsed.map((item) => item.trim()) : null;
};

const parsePrice = (raw) => {
  if (raw === "" || raw === null || raw === undefined || typeof raw === "boolean") return null;
  const price = Number(raw);
  return Number.isFinite(price) && price >= 0 && price <= 10000000 ? price : null;
};

const parseBoolean = (raw) => {
  if (typeof raw === "boolean") return raw;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
};

const parseFeatures = (raw) => {
  const parsed = parseMaybeJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const features = { ...DEFAULT_FEATURES };
  if (typeof parsed.sandboxEnabled === "boolean") features.sandboxEnabled = parsed.sandboxEnabled;
  if (typeof parsed.notesEnabled === "boolean") features.notesEnabled = parsed.notesEnabled;
  if (typeof parsed.sandboxLanguage === "string" && parsed.sandboxLanguage.length <= MAX_SANDBOX_LANGUAGE_LENGTH) {
    features.sandboxLanguage = parsed.sandboxLanguage;
  }
  return features;
};

const sumSubSectionSeconds = (courseContent) => {
  let seconds = 0;
  for (const section of courseContent || []) {
    for (const subSection of section.subSection || []) {
      seconds += parseInt(subSection.timeDuration, 10) || 0;
    }
  }
  return seconds;
};

const pickThumbnailFile = (req) => {
  const candidate = req.files?.thumbnailImage;
  return Array.isArray(candidate) ? candidate[0] : candidate || null;
};

exports.createCourse = async (req, res) => {
  try {
    const { courseName, courseDescription, whatYouWillLearn, price: rawPrice, category, status, features: rawFeatures } =
      req.body || {};

    const tag = parseStringList(req.body?.tag);
    const instructions = parseStringList(req.body?.instructions);
    const price = parsePrice(rawPrice);
    const thumbnail = pickThumbnailFile(req);

    if (
      !isBoundedText(courseName, MAX_NAME_LENGTH) ||
      !isBoundedText(courseDescription, MAX_DESCRIPTION_LENGTH) ||
      !isBoundedText(whatYouWillLearn, MAX_DESCRIPTION_LENGTH) ||
      price === null ||
      !category ||
      !thumbnail ||
      !instructions ||
      !tag
    ) {
      return res.status(400).json({ success: false, message: "All fields are required and must be valid" });
    }
    if (!isObjectId(category)) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }
    if (status !== undefined && !["Draft", "Published"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(404).json({ success: false, message: "Category Details not found" });
    }

    const thumbnailDetails = await uploadFileToCloudinary(thumbnail, process.env.FOLDER_NAME);

    const newCourse = await Course.create({
      courseName: courseName.trim(),
      courseDescription: courseDescription.trim(),
      instructor: req.user.id,
      whatYouWillLearn: whatYouWillLearn.trim(),
      price,
      category: categoryDetails._id,
      tag,
      status: status || "Draft",
      instructions,
      features: (rawFeatures && parseFeatures(rawFeatures)) || DEFAULT_FEATURES,
      thumbnail: thumbnailDetails.secure_url,
      createdAt: Date.now(),
    });

    await User.updateOne({ _id: req.user.id }, { $push: { courses: newCourse._id } });
    await Category.updateOne({ _id: categoryDetails._id }, { $push: { courses: newCourse._id } });

    const data = newCourse.toObject();
    delete data.enrollmentRequests;

    return res.status(200).json({ success: true, data, message: "New Course created successfully" });
  } catch (error) {
    return sendServerError(res, "Error while creating new course", error, "Error while creating new course");
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const { categoryId, category, page = "1", limit = "10", search = "", price = "all", sort = "newest", instructorId } =
      req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * lim;

    const match = { status: "Published" };

    const requestedCategory = categoryId || category;
    if (requestedCategory) {
      if (!isObjectId(requestedCategory)) {
        return res.status(400).json({ success: false, message: "Invalid category id" });
      }
      match.category = new mongoose.Types.ObjectId(requestedCategory);
    }

    if (instructorId) {
      if (!isObjectId(instructorId)) {
        return res.status(400).json({ success: false, message: "Invalid instructor id" });
      }
      match.instructor = new mongoose.Types.ObjectId(instructorId);
    }

    if (price === "free") match.price = 0;
    else if (price === "paid") match.price = { $gt: 0 };

    const searchRegex = buildSearchRegex(search);
    if (searchRegex) {
      match.$or = [{ courseName: searchRegex }, { courseDescription: searchRegex }];
    }

    const total = await Course.countDocuments(match);

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };

    const pagination = { total, page: pageNum, limit: lim, totalPages: Math.ceil(total / lim) };

    if (sort === "popular" || sort === "students_desc" || sort === "students_asc") {
      const direction = sort === "students_asc" ? 1 : -1;

      const courses = await Course.aggregate([
        { $match: match },
        { $addFields: { enrolledCount: { $size: { $ifNull: ["$studentsEnrolled", []] } } } },
        { $sort: { enrolledCount: direction, createdAt: -1 } },
        { $skip: skip },
        { $limit: lim },
        { $lookup: { from: "users", localField: "instructor", foreignField: "_id", as: "instructor" } },
        { $unwind: { path: "$instructor", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" } },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            courseName: 1,
            courseDescription: 1,
            price: 1,
            thumbnail: 1,
            createdAt: 1,
            enrolledCount: 1,
            studentsEnrolled: 1,
            ratingAndReviews: 1,
            instructor: {
              _id: "$instructor._id",
              firstName: "$instructor.firstName",
              lastName: "$instructor.lastName",
              image: "$instructor.image",
            },
            category: { _id: "$category._id", name: "$category.name" },
          },
        },
      ]).exec();

      return res.status(200).json({
        success: true,
        data: { courses, ...pagination },
        message: "Data for courses fetched successfully with category details",
      });
    }

    const courses = await Course.find(match, {
      courseName: 1,
      courseDescription: 1,
      price: 1,
      thumbnail: 1,
      instructor: 1,
      ratingAndReviews: 1,
      studentsEnrolled: 1,
      category: 1,
      createdAt: 1,
    })
      .populate({ path: "instructor", select: "firstName lastName image" })
      .populate({ path: "category", select: "name" })
      .sort(sortOption)
      .skip(skip)
      .limit(lim)
      .exec();

    return res.status(200).json({
      success: true,
      data: { courses, ...pagination },
      message: "Data for courses fetched successfully with category names",
    });
  } catch (error) {
    return sendServerError(res, "Error while fetching courses:", error, "Error while fetching courses");
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body || {};
    if (!isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }

    const courseDetails = await Course.findById(courseId)
      .select("-enrollmentRequests")
      .populate(instructorPopulation)
      .populate("category")
      .populate("ratingAndReviews")
      .populate({ path: "courseContent", populate: { path: "subSection", select: "-videoUrl -supportMaterials" } })
      .exec();

    if (!courseDetails || courseDetails.status !== "Published") {
      return res.status(404).json({ success: false, message: `Could not find the course with ${courseId}` });
    }

    const totalDuration = convertSecondsToDuration(sumSubSectionSeconds(courseDetails.courseContent));

    return res.status(200).json({
      success: true,
      data: { courseDetails, totalDuration },
      message: "Fetched course data successfully",
    });
  } catch (error) {
    return sendServerError(res, "Error while fetching course details", error, "Error while fetching course details");
  }
};

exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body || {};
    const userId = req.user.id;

    if (!isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }

    const courseDetails = await Course.findById(courseId)
      .populate(instructorPopulation)
      .populate("category")
      .populate("ratingAndReviews")
      .populate(contentPopulation)
      .exec();

    if (!courseDetails) {
      return res.status(404).json({ success: false, message: `Could not find course with id: ${courseId}` });
    }

    if (!(await isEnrolledOrOwner(req, courseDetails))) {
      return res.status(403).json({ success: false, message: "You do not have access to this course" });
    }

    const courseData = courseDetails.toObject();
    if (!canManageCourse(req, courseDetails)) delete courseData.enrollmentRequests;

    const courseProgress = await CourseProgress.findOne({ courseID: courseId, userId });

    return res.status(200).json({
      success: true,
      data: {
        courseDetails: courseData,
        totalDuration: convertSecondsToDuration(sumSubSectionSeconds(courseData.courseContent)),
        completedVideos: courseProgress?.completedVideos || [],
      },
    });
  } catch (error) {
    return sendServerError(res, "getFullCourseDetails error", error, "Error while fetching course details");
  }
};

async function buildEditableUpdates(body) {
  const updates = {};
  const invalid = (message) => ({ error: message });

  if (body.courseName !== undefined) {
    if (!isBoundedText(body.courseName, MAX_NAME_LENGTH)) return invalid("Invalid courseName");
    updates.courseName = body.courseName.trim();
  }
  if (body.courseDescription !== undefined) {
    if (!isBoundedText(body.courseDescription, MAX_DESCRIPTION_LENGTH)) return invalid("Invalid courseDescription");
    updates.courseDescription = body.courseDescription.trim();
  }
  if (body.whatYouWillLearn !== undefined) {
    if (!isBoundedText(body.whatYouWillLearn, MAX_DESCRIPTION_LENGTH)) return invalid("Invalid whatYouWillLearn");
    updates.whatYouWillLearn = body.whatYouWillLearn.trim();
  }
  if (body.price !== undefined) {
    const price = parsePrice(body.price);
    if (price === null) return invalid("price must be a number greater than or equal to 0");
    updates.price = price;
  }
  if (body.tag !== undefined) {
    const tag = parseStringList(body.tag);
    if (!tag) return invalid("Invalid tag");
    updates.tag = tag;
  }
  if (body.instructions !== undefined) {
    const instructions = parseStringList(body.instructions);
    if (!instructions) return invalid("Invalid instructions");
    updates.instructions = instructions;
  }
  if (body.requiresApproval !== undefined) {
    const requiresApproval = parseBoolean(body.requiresApproval);
    if (requiresApproval === null) return invalid("requiresApproval must be boolean");
    updates.requiresApproval = requiresApproval;
  }
  if (body.features !== undefined) {
    const features = parseFeatures(body.features);
    if (!features) return invalid("Invalid features");
    updates.features = features;
  }
  if (body.category !== undefined) {
    if (!isObjectId(body.category)) return invalid("Invalid category");
    const category = await Category.findById(body.category).select("_id");
    if (!category) return invalid("Category not found");
    updates.category = category._id;
  }
  return { updates };
}

exports.editCourse = async (req, res) => {
  try {
    const body = req.body || {};
    const { courseId } = body;

    if (!isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    if (!canManageCourse(req, course)) {
      return res.status(403).json({ success: false, message: "Forbidden: you do not own this course" });
    }

    const { updates, error } = await buildEditableUpdates(body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const thumbnailFile = pickThumbnailFile(req);
    if (thumbnailFile) {
      const thumbnailImage = await uploadFileToCloudinary(thumbnailFile, process.env.FOLDER_NAME);
      updates.thumbnail = thumbnailImage.secure_url;
    }

    const previousCategory = course.category;
    course.set(updates);
    course.updatedAt = Date.now();
    await course.save();

    if (updates.category && String(previousCategory) !== String(updates.category)) {
      await Category.updateOne({ _id: previousCategory }, { $pull: { courses: course._id } });
      await Category.updateOne({ _id: updates.category }, { $addToSet: { courses: course._id } });
    }

    const updatedCourse = await Course.findById(courseId)
      .populate(instructorPopulation)
      .populate("category")
      .populate("ratingAndReviews")
      .populate({ path: "courseContent", populate: { path: "subSection" } })
      .exec();

    return res.status(200).json({ success: true, message: "Course updated successfully", data: updatedCourse });
  } catch (error) {
    return sendServerError(res, "editCourse error", error, "Error while updating course");
  }
};

exports.toggleCoursePublish = async (req, res) => {
  try {
    const { courseId, publish } = req.body || {};
    if (!isObjectId(courseId)) return res.status(400).json({ success: false, message: "Valid courseId is required" });
    if (typeof publish !== "boolean") return res.status(400).json({ success: false, message: "publish must be boolean" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (!canManageCourse(req, course)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    course.status = publish ? "Published" : "Draft";
    course.updatedAt = Date.now();
    await course.save();

    const updatedCourse = await Course.findById(courseId)
      .populate(contentPopulation)
      .populate({ path: "instructor", select: "firstName lastName image" })
      .populate("category")
      .lean();

    updatedCourse.published = updatedCourse.status === "Published";

    return res.status(200).json({
      success: true,
      message: "Course publish status updated",
      data: { updatedCourse, published: updatedCourse.published },
    });
  } catch (error) {
    return sendServerError(res, "toggleCoursePublish error", error, "Failed to update publish status");
  }
};

exports.getInstructorCourses = async (req, res) => {
  try {
    const { page = "1", limit = "10", search = "" } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * lim;

    let instructorCourses = await Course.find({ instructor: req.user.id })
      .select("-enrollmentRequests")
      .populate(contentPopulation)
      .sort({ createdAt: -1 })
      .lean();

    const searchRegex = buildSearchRegex(search);
    if (searchRegex) {
      instructorCourses = instructorCourses.filter(
        (course) => searchRegex.test(course.courseName) || searchRegex.test(course.courseDescription)
      );
    }

    for (const course of instructorCourses) {
      const sections = Array.isArray(course.courseContent) ? course.courseContent : [];
      course.totalDuration = convertSecondsToDuration(sumSubSectionSeconds(sections));
      course.subsectionLength = sections.reduce((count, section) => count + (section.subSection?.length || 0), 0);
      course.studentsEnrolledCount = Array.isArray(course.studentsEnrolled) ? course.studentsEnrolled.length : 0;
    }

    const total = instructorCourses.length;

    return res.status(200).json({
      success: true,
      data: {
        courses: instructorCourses.slice(skip, skip + lim),
        total,
        page: pageNum,
        limit: lim,
        totalPages: Math.ceil(total / lim),
      },
    });
  } catch (error) {
    return sendServerError(res, "GET_INSTRUCTOR_COURSES error", error, "Failed to fetch instructor courses");
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body || {};
    if (!isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    if (!canManageCourse(req, course)) {
      return res.status(403).json({ success: false, message: "Forbidden: you do not own this course" });
    }

    await deleteCourseWithDependents(course);

    return res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    return sendServerError(res, "deleteCourse error", error, "Error while Deleting course");
  }
};

const validateNoteTarget = async (req, res) => {
  const { courseId, sectionId, subSectionId } = req.body || {};
  if (!isObjectId(courseId)) {
    res.status(400).json({ success: false, message: "Valid courseId is required" });
    return null;
  }
  for (const optionalId of [sectionId, subSectionId]) {
    if (optionalId && !isObjectId(optionalId)) {
      res.status(400).json({ success: false, message: "Invalid sectionId or subSectionId" });
      return null;
    }
  }
  const course = await Course.findById(courseId).select("instructor studentsEnrolled");
  if (!course) {
    res.status(404).json({ success: false, message: "Course not found" });
    return null;
  }
  if (!(await isEnrolledOrOwner(req, course))) {
    res.status(403).json({ success: false, message: "You do not have access to this course" });
    return null;
  }
  const query = { userId: req.user.id, courseId };
  if (subSectionId) query.subSectionId = subSectionId;
  else if (sectionId) query.sectionId = sectionId;
  return query;
};

exports.getNote = async (req, res) => {
  try {
    const query = await validateNoteTarget(req, res);
    if (!query) return;

    const note = await Note.findOne(query).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({ success: true, data: note || { content: "" } });
  } catch (error) {
    return sendServerError(res, "GET_NOTE error", error, "Failed to fetch note");
  }
};

exports.saveNote = async (req, res) => {
  try {
    const { content = "", sectionId, subSectionId } = req.body || {};
    if (typeof content !== "string" || content.length > MAX_NOTE_LENGTH) {
      return res.status(400).json({ success: false, message: "Invalid note content" });
    }

    const query = await validateNoteTarget(req, res);
    if (!query) return;

    const onInsert = {};
    if (sectionId && !query.sectionId) onInsert.sectionId = sectionId;
    if (subSectionId && !query.subSectionId) onInsert.subSectionId = subSectionId;

    const note = await Note.findOneAndUpdate(
      query,
      { $set: { content }, ...(Object.keys(onInsert).length ? { $setOnInsert: onInsert } : {}) },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, data: note });
  } catch (error) {
    return sendServerError(res, "SAVE_NOTE error", error, "Failed to save note");
  }
};

exports.requestEnrollment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body || {};
    if (!isObjectId(courseId)) return res.status(400).json({ success: false, message: "Valid courseId required" });

    const course = await Course.findOne({ _id: courseId, status: "Published" });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (course.studentsEnrolled.some((studentId) => String(studentId) === String(userId))) {
      return res.status(400).json({ success: false, message: "Already enrolled" });
    }

    const { isNew } = await createEnrollmentRequest(course, userId);
    if (!isNew) {
      return res.status(200).json({ success: true, message: "Enrollment request already pending" });
    }

    return res.status(200).json({ success: true, message: "Enrollment request submitted and pending instructor approval" });
  } catch (error) {
    return sendServerError(res, "requestEnrollment error", error, "Failed to submit enrollment request");
  }
};

exports.getEnrollmentRequests = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isObjectId(courseId)) return res.status(400).json({ success: false, message: "Invalid courseId" });

    const course = await Course.findById(courseId)
      .populate({ path: "enrollmentRequests.user", select: "firstName lastName email image" })
      .populate({ path: "enrollmentRequests.responder", select: "firstName lastName email image" });

    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!canManageCourse(req, course)) return res.status(403).json({ success: false, message: "Forbidden" });

    const enrollmentRequests = course.enrollmentRequests.map((request) => ({
      ...request.toObject(),
      responder: request.responder ? `${request.responder.firstName} ${request.responder.lastName}` : null,
    }));

    return res.status(200).json({ success: true, data: { enrollmentRequests } });
  } catch (error) {
    return sendServerError(res, "getEnrollmentRequests error", error, "Failed to fetch enrollment requests");
  }
};

async function notifyStudent(studentId, subject, body) {
  try {
    const student = await User.findById(studentId).select("email");
    if (student) await mailSender(student.email, subject, body);
  } catch (error) {
    console.error("Failed to notify student:", error.message);
  }
}

exports.respondEnrollmentRequest = async (req, res) => {
  try {
    const { courseId, requestId } = req.params;
    const { action, note } = req.body || {};

    if (!isObjectId(courseId) || !isObjectId(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }
    if (note !== undefined && (typeof note !== "string" || note.length > 1000)) {
      return res.status(400).json({ success: false, message: "Invalid note" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!canManageCourse(req, course)) return res.status(403).json({ success: false, message: "Forbidden" });

    const request = course.enrollmentRequests.id(requestId);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.status !== "Pending") {
      return res.status(409).json({ success: false, message: "Request has already been answered" });
    }

    request.status = action === "approve" ? "Approved" : "Rejected";
    request.respondedAt = Date.now();
    request.responder = req.user.id;
    request.note = note || "";
    await course.save();

    if (action === "approve") {
      await completeEnrollment(courseId, request.user);
      return res.status(200).json({ success: true, message: "Student approved and enrolled" });
    }

    await notifyStudent(
      request.user,
      `Enrollment rejected: ${course.courseName}`,
      `Your enrollment request for ${escapeHtml(course.courseName)} was rejected. ${escapeHtml(note || "")}`
    );
    return res.status(200).json({ success: true, message: "Request rejected" });
  } catch (error) {
    return sendServerError(res, "respondEnrollmentRequest error", error, "Failed to respond to enrollment request");
  }
};

exports.getMyEnrollmentRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const courses = await Course.find({ "enrollmentRequests.user": userId })
      .populate(contentPopulation)
      .populate({ path: "enrollmentRequests.responder", select: "firstName lastName email" })
      .lean();

    const requests = [];

    for (const course of courses) {
      const ownRequest = (course.enrollmentRequests || []).find((request) => String(request.user) === String(userId));
      if (!ownRequest) continue;

      requests.push({
        _id: ownRequest._id,
        course: {
          _id: course._id,
          courseName: course.courseName,
          courseDescription: course.courseDescription,
          thumbnail: course.thumbnail,
          totalDuration: convertSecondsToDuration(sumSubSectionSeconds(course.courseContent)),
        },
        requestedAt: ownRequest.requestedAt,
        status: ownRequest.status,
        responder: ownRequest.responder
          ? {
              _id: ownRequest.responder._id || ownRequest.responder,
              firstName: ownRequest.responder.firstName,
              lastName: ownRequest.responder.lastName,
              email: ownRequest.responder.email,
            }
          : null,
        note: ownRequest.note || "",
      });
    }

    return res.status(200).json({ success: true, data: { requests } });
  } catch (error) {
    return sendServerError(res, "getMyEnrollmentRequests error", error, "Failed to fetch enrollment requests");
  }
};
