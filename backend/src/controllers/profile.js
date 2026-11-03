const Profile = require("../models/profile");
const User = require("../models/user");
const CourseProgress = require("../models/courseProgress");
const Course = require("../models/course");
const { uploadFileToCloudinary } = require("../utils/fileUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
const { deleteUserWithData } = require("../utils/userCleanup");
const { isObjectId, buildSearchRegex, sendServerError } = require("../utils/validators");

const SENSITIVE_USER_FIELDS = "-password -token -resetPasswordTokenExpires";
const MAX_NAME_LENGTH = 100;
const MAX_ABOUT_LENGTH = 2000;
const MAX_PUBLIC_COURSES = 50;

const isOptionalBoundedString = (value, maxLength) =>
    value === undefined || value === null || (typeof value === "string" && value.length <= maxLength);

exports.updateProfile = async (req, res) => {
    try {
        const body = req.body || {};
        const { firstName, lastName } = body;
        const additional = body.additionalDetails && typeof body.additionalDetails === "object" ? body.additionalDetails : {};

        const gender = (additional.gender ?? body.gender) || "";
        const dateOfBirth = (additional.dateOfBirth ?? body.dateOfBirth) || "";
        const about = (additional.about ?? body.about) || "";
        let contactNumber = additional.contactNumber ?? body.contactNumber ?? null;

        if (contactNumber && typeof contactNumber === "object") {
            contactNumber = contactNumber.number || contactNumber.value || contactNumber.phone || null;
        }
        if (contactNumber !== null && contactNumber !== undefined) {
            contactNumber = String(contactNumber).trim() || null;
        }

        const isValid =
            isOptionalBoundedString(firstName, MAX_NAME_LENGTH) &&
            isOptionalBoundedString(lastName, MAX_NAME_LENGTH) &&
            isOptionalBoundedString(gender, MAX_NAME_LENGTH) &&
            isOptionalBoundedString(dateOfBirth, MAX_NAME_LENGTH) &&
            isOptionalBoundedString(about, MAX_ABOUT_LENGTH) &&
            isOptionalBoundedString(contactNumber, MAX_NAME_LENGTH);
        if (!isValid) {
            return res.status(400).json({ success: false, message: "Invalid profile fields" });
        }

        const protectMe = typeof additional.protectMe !== "undefined" ? Boolean(additional.protectMe) : undefined;
        const userId = req.user.id;

        const userDetails = await User.findById(userId);
        if (!userDetails) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (typeof firstName === "string") userDetails.firstName = firstName;
        if (typeof lastName === "string") userDetails.lastName = lastName;

        let profileDetails = userDetails.additionalDetails ? await Profile.findById(userDetails.additionalDetails) : null;
        if (!profileDetails) {
            profileDetails = new Profile({});
            userDetails.additionalDetails = profileDetails._id;
        }
        await userDetails.save();

        profileDetails.gender = gender;
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;
        if (typeof protectMe !== "undefined") profileDetails.protectMe = protectMe;
        await profileDetails.save();

        const updatedUserDetails = await User.findById(userId)
            .select(SENSITIVE_USER_FIELDS)
            .populate({ path: "additionalDetails" })
            .lean();

        return res.status(200).json({
            success: true,
            updatedUserDetails,
            message: "Profile updated successfully",
        });
    } catch (error) {
        return sendServerError(res, "Error while updating profile", error, "Error while updating profile");
    }
};

exports.getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid user id" });
        }

        const userDetails = await User.findOne({ _id: id, active: { $ne: false } })
            .select("preferredName firstName lastName image accountType additionalDetails createdAt")
            .populate({ path: "additionalDetails", select: "about protectMe" })
            .lean();

        if (!userDetails) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const displayName =
            userDetails.preferredName || `${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim();

        if (userDetails.additionalDetails?.protectMe) {
            return res.status(200).json({
                success: true,
                data: { isProtected: true, user: { preferredName: displayName, image: userDetails.image || null } },
                message: "Public profile (protected) fetched successfully",
            });
        }

        const publicUser = {
            _id: userDetails._id,
            preferredName: displayName,
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            image: userDetails.image || null,
            createdAt: userDetails.createdAt,
            additionalDetails: { about: userDetails.additionalDetails?.about || null },
        };

        if (userDetails.accountType === "Instructor") {
            publicUser.courses = await Course.find({ instructor: id, status: "Published" })
                .select("courseName thumbnail price")
                .limit(MAX_PUBLIC_COURSES)
                .lean();
        }

        return res.status(200).json({
            success: true,
            data: { isProtected: false, user: publicUser },
            message: "Public profile fetched successfully",
        });
    } catch (error) {
        return sendServerError(res, "Error while fetching public profile", error, "Error while fetching public profile");
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const userDetails = await User.findById(req.user.id);
        if (!userDetails) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const result = await deleteUserWithData(userDetails);
        if (!result.deleted) {
            return res.status(409).json({ success: false, message: result.reason });
        }

        return res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        return sendServerError(res, "Error while deleting account", error, "Error while deleting profile");
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const userDetails = await User.findById(req.user.id)
            .select(SENSITIVE_USER_FIELDS)
            .populate("additionalDetails")
            .exec();

        if (!userDetails) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            data: userDetails,
            message: "User data fetched successfully",
        });
    } catch (error) {
        return sendServerError(res, "Error while fetching user details", error, "Error while fetching user details");
    }
};

exports.updateUserProfileImage = async (req, res) => {
    try {
        const candidate = req.files?.profileImage;
        const profileImage = Array.isArray(candidate) ? candidate[0] : candidate;

        if (!profileImage) {
            return res.status(400).json({ success: false, message: "profileImage file is required" });
        }
        if (!String(profileImage.mimetype || "").startsWith("image/")) {
            return res.status(400).json({ success: false, message: "profileImage must be an image" });
        }

        const image = await uploadFileToCloudinary(profileImage, process.env.FOLDER_NAME, 1000, 1000);

        const updatedUserDetails = await User.findByIdAndUpdate(req.user.id, { image: image.secure_url }, { new: true })
            .select(SENSITIVE_USER_FIELDS)
            .populate({ path: "additionalDetails" });

        return res.status(200).json({
            success: true,
            message: "Image Updated successfully",
            data: updatedUserDetails,
        });
    } catch (error) {
        return sendServerError(res, "Error while updating user profile image", error, "Error while updating user profile image");
    }
};

exports.getEnrolledCourses = async (req, res) => {
    try {
        const { page = "1", limit = "10", search = "" } = req.query;
        const userId = req.user.id;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const skip = (pageNum - 1) * lim;

        const userDetails = await User.findById(userId)
            .populate({
                path: "courses",
                select: "-enrollmentRequests",
                populate: { path: "courseContent", populate: { path: "subSection" } },
            })
            .exec();

        if (!userDetails) {
            return res.status(400).json({ success: false, message: `Could not find user with id: ${userId}` });
        }

        let courses = userDetails.courses.filter(Boolean).map((course) => course.toObject());

        const searchRegex = buildSearchRegex(search);
        if (searchRegex) {
            courses = courses.filter((course) => searchRegex.test(course.courseName) || searchRegex.test(course.courseDescription));
        }

        for (const course of courses) {
            let totalDurationInSeconds = 0;
            let subsectionLength = 0;

            for (const section of course.courseContent || []) {
                const subSections = section.subSection || [];
                totalDurationInSeconds += subSections.reduce((sum, item) => sum + (parseInt(item.timeDuration, 10) || 0), 0);
                subsectionLength += subSections.length;
            }

            course.totalDuration = convertSecondsToDuration(totalDurationInSeconds);

            const courseProgress = await CourseProgress.findOne({ courseID: course._id, userId });
            const completed = courseProgress?.completedVideos.length || 0;
            course.progressPercentage = subsectionLength === 0 ? 100 : Math.round((completed / subsectionLength) * 10000) / 100;
        }

        const total = courses.length;

        return res.status(200).json({
            success: true,
            data: {
                courses: courses.slice(skip, skip + lim),
                total,
                page: pageNum,
                limit: lim,
                totalPages: Math.ceil(total / lim),
            },
        });
    } catch (error) {
        return sendServerError(res, "GET_USER_ENROLLED_COURSES error", error, "Failed to fetch enrolled courses");
    }
};

exports.instructorDashboard = async (req, res) => {
    try {
        const courseDetails = await Course.find({ instructor: req.user.id });

        const courseData = courseDetails.map((course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length;
            return {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                totalStudentsEnrolled,
                totalAmountGenerated: totalStudentsEnrolled * (course.price || 0),
            };
        });

        return res.status(200).json({
            success: true,
            courses: courseData,
            message: "Instructor Dashboard Data fetched successfully",
        });
    } catch (error) {
        return sendServerError(res, "instructorDashboard error", error, "Server Error");
    }
};
