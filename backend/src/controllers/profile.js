const Profile = require("../models/profile");
const User = require("../models/user");
const CourseProgress = require("../models/courseProgress");
const Course = require("../models/course");
const {
    uploadFileToCloudinary,
    deleteResourceFromCloudinary,
} = require("../utils/fileUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");

exports.updateProfile = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            gender: rootGender,
            dateOfBirth: rootDOB,
            about: rootAbout,
            contactNumber: rootContact,
        } = req.body;

        const additional = req.body.additionalDetails || {};

        const gender = (additional.gender ?? rootGender) || "";
        const dateOfBirth = (additional.dateOfBirth ?? rootDOB) || "";
        const about = (additional.about ?? rootAbout) || "";
        let contactNumber = additional.contactNumber ?? rootContact ?? null;

        if (contactNumber && typeof contactNumber === "object") {
            contactNumber =
                contactNumber.number ||
                contactNumber.value ||
                contactNumber.phone ||
                String(contactNumber).trim();
        } else if (contactNumber !== null && contactNumber !== undefined) {
            contactNumber = String(contactNumber).trim();
            if (contactNumber === "") contactNumber = null;
        }

        const protectMe = typeof additional.protectMe !== "undefined" ? Boolean(additional.protectMe) : undefined;

        const userId = req.user.id;

        const userDetails = await User.findById(userId);
        if (!userDetails) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (typeof firstName === "string") userDetails.firstName = firstName;
        if (typeof lastName === "string") userDetails.lastName = lastName;
        await userDetails.save();

        let profileDetails = null;
        if (userDetails.additionalDetails) {
            profileDetails = await Profile.findById(userDetails.additionalDetails);
        } else {
            profileDetails = new Profile({});
            await profileDetails.save();
            userDetails.additionalDetails = profileDetails._id;
            await userDetails.save();
        }

        profileDetails.gender = gender;
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;
        if (typeof protectMe !== "undefined") profileDetails.protectMe = protectMe;
        await profileDetails.save();

        const updatedUserDetails = await User.findById(userId)
            .populate({ path: "additionalDetails" })
            .lean();

        if (updatedUserDetails) {
            delete updatedUserDetails.password;
            delete updatedUserDetails.token;
            delete updatedUserDetails.resetPasswordTokenExpires;
        }

        return res.status(200).json({
            success: true,
            updatedUserDetails,
            message: "Profile updated successfully",
        });
    } catch (error) {
        console.error("Error while updating profile", error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while updating profile",
        });
    }
};

exports.getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "User id required" });
        }

        const userDetails = await User.findById(id)
            .populate("additionalDetails")
            .lean();

        if (!userDetails) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isProtected = !!(userDetails.additionalDetails && userDetails.additionalDetails.protectMe);

        if (isProtected) {
            const minimal = {
                preferredName: userDetails.preferredName || `${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim(),
                accountType: userDetails.accountType || "Student",
                image: userDetails.image || null,
            };
            return res.status(200).json({
                success: true,
                data: { isProtected: true, user: minimal },
                message: "Public profile (protected) fetched successfully",
            });
        }

        const publicUser = { ...userDetails };
        delete publicUser.password;
        delete publicUser.token;
        delete publicUser.resetPasswordTokenExpires;
        delete publicUser.__v;

        return res.status(200).json({
            success: true,
            data: { isProtected: false, user: publicUser },
            message: "Public profile fetched successfully",
        });
    } catch (error) {
        console.error("Error while fetching public profile", error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while fetching public profile",
        });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        const userDetails = await User.findById(userId);
        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        await deleteResourceFromCloudinary(userDetails.image);

        const userEnrolledCoursesId = userDetails.courses;
        console.log("userEnrolledCourses ids = ", userEnrolledCoursesId);

        for (const courseId of userEnrolledCoursesId) {
            await Course.findByIdAndUpdate(courseId, {
                $pull: { studentsEnrolled: userId },
            });
        }

        await Profile.findByIdAndDelete(userDetails.additionalDetails);

        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        console.log("Error while updating profile");
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while deleting profile",
        });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("id - ", userId);

        const userDetails = await User.findById(userId)
            .populate("additionalDetails")
            .exec();

        res.status(200).json({
            success: true,
            data: userDetails,
            message: "User data fetched successfully",
        });
    } catch (error) {
        console.log("Error while fetching user details");
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while fetching user details",
        });
    }
};

exports.updateUserProfileImage = async (req, res) => {
    try {
        const profileImage = req.files?.profileImage;
        const userId = req.user.id;

        const image = await uploadFileToCloudinary(
            profileImage,
            process.env.FOLDER_NAME,
            1000,
            1000
        );

        const updatedUserDetails = await User.findByIdAndUpdate(
            userId,
            { image: image.secure_url },
            { new: true }
        ).populate({
            path: "additionalDetails",
        });

        res.status(200).json({
            success: true,
            message: `Image Updated successfully`,
            data: updatedUserDetails,
        });
    } catch (error) {
        console.log("Error while updating user profile image");
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while updating user profile image",
        });
    }
};

// ================ Get Enrolled Courses ================
exports.getEnrolledCourses = async (req, res) => {
    try {
        const { page = "1", limit = "10", search = "" } = req.query;
        const userId = req.user.id;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const skip = (pageNum - 1) * lim;

        let userDetails = await User.findById(userId)
            .populate({
                path: "courses",
                populate: {
                    path: "courseContent",
                    populate: { path: "subSection" },
                },
            })
            .exec();

        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find user with id: ${userId}`,
            });
        }

        let courses = userDetails.courses.map((course) => course.toObject());

        if (search.trim()) {
            const regex = new RegExp(search, "i");
            courses = courses.filter(
                (c) => regex.test(c.courseName) || regex.test(c.courseDescription)
            );
        }

        for (let i = 0; i < courses.length; i++) {
            let totalDurationInSeconds = 0;
            let subsectionLength = 0;

            for (const section of courses[i].courseContent) {
                totalDurationInSeconds += section.subSection.reduce(
                    (acc, curr) => acc + parseInt(curr.timeDuration),
                    0
                );
                subsectionLength += section.subSection.length;
            }

            courses[i].totalDuration = convertSecondsToDuration(totalDurationInSeconds);

            let courseProgressCount = await CourseProgress.findOne({
                courseID: courses[i]._id,
                userId,
            });

            const completed = courseProgressCount?.completedVideos.length || 0;
            courses[i].progressPercentage =
                subsectionLength === 0
                    ? 100
                    : Math.round((completed / subsectionLength) * 10000) / 100;
        }

        const total = courses.length;
        const paginated = courses.slice(skip, skip + lim);

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
        console.error("GET_USER_ENROLLED_COURSES error", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================ instructor Dashboard ================
exports.instructorDashboard = async (req, res) => {
    try {
        const courseDetails = await Course.find({ instructor: req.user.id });

        const courseData = courseDetails.map((course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length;
            const totalAmountGenerated = totalStudentsEnrolled * course.price;

            // Create a new object with the additional fields
            const courseDataWithStats = {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                // Include other course properties as needed
                totalStudentsEnrolled,
                totalAmountGenerated,
            };

            return courseDataWithStats;
        });

        res.status(200).json({
            courses: courseData,
            message: "Instructor Dashboard Data fetched successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
