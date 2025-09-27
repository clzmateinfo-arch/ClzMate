require("dotenv-flow").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./../models/user");
const Profile = require("./../models/profile");
const otpGenerator = require("otp-generator");
const OTP = require("../models/OTP");
const mailSender = require("../utils/mailSender");
const otpTemplate = require("../mail/templates/emailVerificationTemplate");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");

const JWT_EXPIRES = "24h";

function normalizeEmail(email) {
    return String(email || "").toLowerCase().trim();
}

exports.signup = async (req, res) => {
    try {
        const {
            preferredName,
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;

        const requiredStringFields = [
            { name: "preferredName", value: preferredName },
            { name: "email", value: email },
            { name: "password", value: password },
            { name: "confirmPassword", value: confirmPassword },
            { name: "accountType", value: accountType },
        ];

        const missing = requiredStringFields
            .filter(f => f.value === undefined || f.value === null || (typeof f.value === "string" && f.value.trim() === ""))
            .map(f => f.name);

        if (otp === undefined || otp === null || String(otp).trim() === "") {
            missing.push("otp");
        }

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Required fields are missing or empty: ${missing.join(", ")}`,
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password do not match. Please confirm the password again",
            });
        }

        const emailNormalized = normalizeEmail(email);

        const existingUser = await User.findOne({ email: emailNormalized });

        if (existingUser && existingUser.verified) {
            // await OTP.deleteMany({ email: emailNormalized }).catch(() => { });
            return res.status(200).json({
                success: false,
                message: "User already registered. Please login",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const approved = accountType === "Instructor" || accountType === "INSTRUCTOR"
            ? false
            : true;

        if (existingUser) {
            existingUser.preferredName = preferredName;
            existingUser.firstName = firstName;
            existingUser.lastName = lastName;
            existingUser.password = hashedPassword;
            existingUser.contactNumber = contactNumber || existingUser.contactNumber;
            existingUser.accountType = accountType;
            existingUser.approved = approved;
            existingUser.verified = false;

            if (!existingUser.additionalDetails) {
                const profileDetails = await Profile.create({
                    gender: null,
                    dateOfBirth: null,
                    about: null,
                    contactNumber: contactNumber || null,
                });
                existingUser.additionalDetails = profileDetails._id;
            }

            if (!existingUser.image) {
                existingUser.image = `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`;
            }

            await existingUser.save();
        } else {
            const profileDetails = await Profile.create({
                gender: null,
                dateOfBirth: null,
                about: null,
                contactNumber: contactNumber || null,
            });

            await User.create({
                preferredName,
                firstName,
                lastName,
                email: emailNormalized,
                password: hashedPassword,
                contactNumber: contactNumber || null,
                accountType,
                additionalDetails: profileDetails._id,
                approved,
                verified: false,
                image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
            });
        }

        return res.status(201).json({
            success: true,
            message: "User registered and verified successfully",
            email: emailNormalized,
        });
    } catch (error) {
        console.error("Error while registering user (signup):", error);
        return res.status(500).json({
            success: false,
            message: "Failed to register user. Please try again later",
            error: error.message,
        });
    }
};

exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const emailNormalized = normalizeEmail(email);

        const existingUser = await User.findOne({ email: emailNormalized });

        if (existingUser && existingUser.verified) {
            return res.status(409).json({
                success: false,
                message: "User is already registered",
            });
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
            digits: true,
        });

        const name = emailNormalized
            .split("@")[0]
            .split(".")
            .map((part) => part.replace(/\d+/g, ""))
            .join(" ");

        await mailSender(emailNormalized, "OTP Verification Email", otpTemplate(otp, name));

        await OTP.create({ email: emailNormalized, otp });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });
    } catch (error) {
        console.error("Error while generating OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Error while generating OTP",
            error: error.message,
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: email and otp",
            });
        }

        const emailNormalized = normalizeEmail(email);

        const user = await User.findOne({ email: emailNormalized });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.verified) {
            return res.status(400).json({
                success: false,
                message: "User is already verified",
            });
        }

        const recentOtp = await OTP.findOne({ email: emailNormalized }).sort({
            createdAt: -1,
        });

        if (!recentOtp) {
            return res.status(400).json({
                success: false,
                message: "OTP not found, please request a new one",
            });
        }

        if (String(recentOtp.otp) !== String(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        await User.updateOne({ _id: user._id }, { $set: { verified: true } });

        // await OTP.deleteMany({ email: emailNormalized });

        return res.status(200).json({
            success: true,
            message: "OTP verified. User is now verified",
            email: user.email,
        });
    } catch (error) {
        console.error("Error when trying validate OTP,", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while verifying OTP",
            error: error.message,
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const emailNormalized = normalizeEmail(email);
        let user = await User.findOne({ email: emailNormalized }).populate("additionalDetails");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "You are not registered with us",
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const payload = {
            email: user.email,
            id: user._id,
            accountType: user.accountType,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES });

        user = user.toObject();
        user.token = token;
        user.password = undefined;

        const cookieOptions = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        };

        res.cookie("token", token, cookieOptions).status(200).json({
            success: true,
            user,
            token,
            message: "User logged in successfully",
        });
    } catch (error) {
        console.error("Error while logging in user:", error);
        res.status(500).json({
            success: false,
            message: "Error while logging in user",
            error: error.message,
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match",
            });
        }

        const userDetails = await User.findById(req.user.id);
        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: hashedPassword },
            { new: true }
        );

        try {
            await mailSender(
                updatedUserDetails.email,
                "Password for your account has been updated",
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
        } catch (error) {
            console.error("Error occurred while sending email:", error);
        }

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Error while changing password:", error);
        return res.status(500).json({
            success: false,
            message: "Error while changing password",
            error: error.message,
        });
    }
};
