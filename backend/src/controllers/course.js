const mongoose = require("mongoose");
const Course = require("../models/course");
const User = require("../models/user");
const Category = require("../models/category");
const Section = require("../models/section");
const SubSection = require("../models/subSection");
const CourseProgress = require("../models/courseProgress");
const {
    uploadFileToCloudinary,
    deleteResourceFromCloudinary,
} = require("../utils/fileUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");

exports.createCourse = async (req, res) => {
    try {
        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            category,
            instructions: _instructions,
            status,
            tag: _tag,
        } = req.body;

        const tag = JSON.parse(_tag);
        const instructions = JSON.parse(_instructions);
        const thumbnail = req.files?.thumbnailImage;

        if (
            !courseName ||
            !courseDescription ||
            !whatYouWillLearn ||
            !price ||
            !category ||
            !thumbnail ||
            !instructions.length ||
            !tag.length
        ) {
            return res.status(400).json({
                success: false,
                message: "All Fileds are required",
            });
        }

        if (!status || status === undefined) {
            status = "Draft";
        }

        const instructorId = req.user.id;
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(401).json({
                success: false,
                message: "Category Details not found",
            });
        }

        const thumbnailDetails = await uploadFileToCloudinary(
            thumbnail,
            process.env.FOLDER_NAME
        );
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorId,
            whatYouWillLearn,
            price,
            category: categoryDetails._id,
            tag,
            status,
            instructions,
            thumbnail: thumbnailDetails.secure_url,
            createdAt: Date.now(),
        });

        await User.findByIdAndUpdate(
            instructorId,
            {
                $push: {
                    courses: newCourse._id,
                },
            },
            { new: true }
        );

        await Category.findByIdAndUpdate(
            { _id: category },
            {
                $push: {
                    courses: newCourse._id,
                },
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: newCourse,
            message: "New Course created successfully",
        });
    } catch (error) {
        console.log("Error while creating new course");
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while creating new course",
        });
    }
};

exports.getAllCourses = async (req, res) => {
    try {
        const {
            categoryId,
            category,
            page = "1",
            limit = "10",
            search = "",
            price = "all",
            level = "all",
            sort = "newest",
            instructorId,
        } = req.query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const skip = (pageNum - 1) * lim;

        const match = {};

        const cat = categoryId || category;
        if (cat) {
            if (mongoose.Types.ObjectId.isValid(cat)) {
                match.category = new mongoose.Types.ObjectId(cat);
            } else {
                match.category = cat;
            }
        }

        if (instructorId && mongoose.Types.ObjectId.isValid(instructorId)) {
            match.instructor = new mongoose.Types.ObjectId(instructorId);
        }

        if (price === "free") match.price = 0;
        else if (price === "paid") match.price = { $gt: 0 };

        if (level && level !== "all") {
            match.level = level;
        }

        if (search.trim()) {
            match.$or = [
                { courseName: { $regex: search, $options: "i" } },
                { courseDescription: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Course.countDocuments(match);

        let sortOption = { createdAt: -1 };
        if (sort === "oldest") sortOption = { createdAt: 1 };
        else if (sort === "price_asc") sortOption = { price: 1 };
        else if (sort === "price_desc") sortOption = { price: -1 };

        if (sort === "popular" || sort === "students_desc" || sort === "students_asc") {
            const direction = sort === "students_asc" ? 1 : -1;

            const pipeline = [
                { $match: match },
                {
                    $addFields: {
                        enrolledCount: {
                            $cond: {
                                if: { $isArray: "$studentsEnrolled" },
                                then: { $size: "$studentsEnrolled" },
                                else: { $ifNull: ["$studentsEnrolled", 0] }
                            }
                        }
                    }
                },
                { $sort: { enrolledCount: direction, createdAt: -1 } },
                { $skip: skip },
                { $limit: lim },
                {
                    $lookup: {
                        from: "users",
                        localField: "instructor",
                        foreignField: "_id",
                        as: "instructor"
                    }
                },
                { $unwind: { path: "$instructor", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        courseName: 1,
                        courseDescription: 1,
                        price: 1,
                        thumbnail: 1,
                        instructor: {
                            firstName: "$instructor.firstName",
                            lastName: "$instructor.lastName",
                            email: "$instructor.email",
                            image: "$instructor.image"
                        },
                        ratingAndReviews: 1,
                        studentsEnrolled: 1,
                        level: 1,
                        category: 1,
                        createdAt: 1,
                        enrolledCount: 1
                    }
                }
            ];

            const courses = await Course.aggregate(pipeline).exec();

            return res.status(200).json({
                success: true,
                data: {
                    courses,
                    total,
                    page: pageNum,
                    limit: lim,
                    totalPages: Math.ceil(total / lim),
                },
                message: "Data for courses fetched successfully",
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
            level: 1,
            category: 1,
            createdAt: 1,
        })
            .populate({
                path: "instructor",
                select: "firstName lastName email image",
            })
            .sort(sortOption)
            .skip(skip)
            .limit(lim)
            .exec();

        return res.status(200).json({
            success: true,
            data: {
                courses,
                total,
                page: pageNum,
                limit: lim,
                totalPages: Math.ceil(total / lim),
            },
            message: "Data for courses fetched successfully",
        });
    } catch (error) {
        console.error("Error while fetching courses:", error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while fetching courses",
        });
    }
};

exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")

            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    select: "-videoUrl",
                },
            })
            .exec();

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find the course with ${courseId}`,
            });
        }

        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration);
                totalDurationInSeconds += timeDurationInSeconds;
            });
        });

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
            },
            message: "Fetched course data successfully",
        });
    } catch (error) {
        console.log("Error while fetching course details");
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while fetching course details",
        });
    }
};

exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;

        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec();

        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        });

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            });
        }

        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration);
                totalDurationInSeconds += timeDurationInSeconds;
            });
        });

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos
                    ? courseProgressCount?.completedVideos
                    : [],
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.editCourse = async (req, res) => {
    try {
        const rawBody = req.body;
        const { courseId } = rawBody;

        let updates = rawBody;
        if (typeof updates === "string") {
            try {
                updates = JSON.parse(updates);
            } catch (e) {
            }
        }

        if (!updates || typeof updates !== "object") {
            updates = {};
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        let thumbnailFile = null;
        if (req.file) {
            thumbnailFile = req.file;
        } else if (req.files) {
            if (req.files.thumbnailImage) {
                thumbnailFile = Array.isArray(req.files.thumbnailImage)
                    ? req.files.thumbnailImage[0]
                    : req.files.thumbnailImage;
            } else if (Array.isArray(req.files) && req.files.length > 0) {
                thumbnailFile = req.files[0];
            }
        }

        if (thumbnailFile) {
            const thumbnailImage = await uploadFileToCloudinary(
                thumbnailFile,
                process.env.FOLDER_NAME
            );
            course.thumbnail = thumbnailImage.secure_url;
        }

        delete updates.courseId;
        delete updates.thumbnailImage;
        delete updates.thumbnail;

        for (const [key, rawVal] of Object.entries(updates)) {
            if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;

            let value = rawVal;

            if (typeof value === "string") {
                const trimmed = value.trim();
                if (
                    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                    (trimmed.startsWith("[") && trimmed.endsWith("]"))
                ) {
                    try {
                        value = JSON.parse(trimmed);
                    } catch (e) {
                    }
                }
            }

            if ((key === "tag" || key === "instructions") && typeof value === "string") {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                }
            }

            course[key] = value;
        }

        course.updatedAt = Date.now();
        await course.save();

        const updatedCourse = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate: { path: "additionalDetails" },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: { path: "subSection" },
            })
            .exec();

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error while updating course",
            error: error.message,
        });
    }
};

exports.getInstructorCourses = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { page = "1", limit = "10", search = "" } = req.query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const skip = (pageNum - 1) * lim;

        let query = { instructor: instructorId };

        let instructorCourses = await Course.find(query)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .sort({ createdAt: -1 })
            .lean();

        if (!Array.isArray(instructorCourses)) instructorCourses = [];

        const trimmedSearch = (search || "").trim();
        if (trimmedSearch) {
            const regex = new RegExp(trimmedSearch, "i");
            instructorCourses = instructorCourses.filter(
                (c) => regex.test(c.courseName) || regex.test(c.courseDescription)
            );
        }

        for (let i = 0; i < instructorCourses.length; i++) {
            const course = instructorCourses[i];

            let totalDurationInSeconds = 0;
            let subsectionLength = 0;

            if (Array.isArray(course.courseContent)) {
                for (const section of course.courseContent) {
                    if (Array.isArray(section.subSection)) {
                        subsectionLength += section.subSection.length;
                        totalDurationInSeconds += section.subSection.reduce((acc, curr) => {
                            const dur = parseInt(curr.timeDuration || 0, 10) || 0;
                            return acc + dur;
                        }, 0);
                    }
                }
            }

            course.totalDuration = convertSecondsToDuration(totalDurationInSeconds);
            course.subsectionLength = subsectionLength;

            course.studentsEnrolledCount = Array.isArray(course.studentsEnrolled) ? course.studentsEnrolled.length : 0;
        }

        const total = instructorCourses.length;
        const paginated = instructorCourses.slice(skip, skip + lim);

        return res.status(200).json({
            success: true,
            data: {
                courses: paginated,
                total,
                page: pageNum,
                limit: lim,
                totalPages: Math.ceil(total / lim),
            },
        });
    } catch (error) {
        console.error("GET_INSTRUCTOR_COURSES error", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch instructor courses",
        });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const studentsEnrolled = course.studentsEnrolled;
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, {
                $pull: { courses: courseId },
            });
        }

        await deleteResourceFromCloudinary(course?.thumbnail);

        const courseSections = course.courseContent;
        for (const sectionId of courseSections) {
            const section = await Section.findById(sectionId);
            if (section) {
                const subSections = section.subSection;
                for (const subSectionId of subSections) {
                    const subSection = await SubSection.findById(subSectionId);
                    if (subSection) {
                        // delete video
                        if (subSection.videoUrl) {
                            try {
                                await deleteResourceFromCloudinary(subSection.videoUrl);
                            } catch (e) {
                                console.warn("Error deleting subSection.videoUrl:", e.message);
                            }
                        }
                        // delete pdf
                        if (subSection.pdfUrl) {
                            try {
                                await deleteResourceFromCloudinary(subSection.pdfUrl);
                            } catch (e) {
                                console.warn("Error deleting subSection.pdfUrl:", e.message);
                            }
                        }
                        // delete support materials array
                        if (Array.isArray(subSection.supportMaterials)) {
                            for (const sUrl of subSection.supportMaterials) {
                                try {
                                    await deleteResourceFromCloudinary(sUrl);
                                } catch (e) {
                                    console.warn("Error deleting support material:", e.message);
                                }
                            }
                        }
                    }
                    await SubSection.findByIdAndDelete(subSectionId);
                }
            }

            await Section.findByIdAndDelete(sectionId);
        }

        await Course.findByIdAndDelete(courseId);

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error while Deleting course",
            error: error.message,
        });
    }
};
