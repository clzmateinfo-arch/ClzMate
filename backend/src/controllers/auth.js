require("dotenv-flow").config();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mailSender = require("../utils/mailSender");
const { otpEmail, welcomeEmail, passwordChangedEmail } = require("../mail/templates");
const User = require("../models/user");
const Profile = require("../models/profile");
const OTP = require("../models/OTP");
const { signToken } = require("../utils/jwt");
const { validatePassword } = require("../utils/passwordPolicy");
const { isNonEmptyString } = require("../middleware/sanitize");

const JWT_EXPIRES = process.env.JWT_EXPIRES || "24h";
const PUBLIC_SIGNUP_ROLES = ["Student", "Instructor"];
const OTP_MAX_ATTEMPTS = 5;
const OTP_TTL_MINUTES = Math.round(OTP.OTP_TTL_SECONDS / 60);
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 10);

const normalizeEmail = (email) => String(email || "").toLowerCase().trim();
const hashOtp = (email, otp) =>
    crypto.createHmac("sha256", process.env.JWT_SECRET || "").update(`${email}:${otp}`).digest("hex");
const generateOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");
const safeEqual = (left, right) => {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};
const buildAvatarUrl = (firstName, lastName) =>
    `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(`${firstName || ""} ${lastName || ""}`.trim())}`;

exports.signup = async (req, res) => {
    try {
        const { preferredName, firstName, lastName, email, password, confirmPassword, accountType, contactNumber } = req.body;

        const missing = [
            ["preferredName", preferredName],
            ["email", email],
            ["password", password],
            ["confirmPassword", confirmPassword],
            ["accountType", accountType],
        ]
            .filter(([, value]) => !isNonEmptyString(value))
            .map(([name]) => name);

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Required fields are missing or invalid: ${missing.join(", ")}`,
            });
        }

        if (!PUBLIC_SIGNUP_ROLES.includes(accountType)) {
            return res.status(400).json({
                success: false,
                message: `Account type must be one of: ${PUBLIC_SIGNUP_ROLES.join(", ")}`,
            });
        }

        const emailNormalized = normalizeEmail(email);
        if (!EMAIL_PATTERN.test(emailNormalized)) {
            return res.status(400).json({ success: false, message: "Email is invalid" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password do not match. Please confirm the password again",
            });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ success: false, message: passwordError });
        }

        const existingUser = await User.findOne({ email: emailNormalized });
        if (existingUser && existingUser.verified) {
            return res.status(409).json({
                success: false,
                message: "User already registered. Please login",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const approved = accountType !== "Instructor";
        const safeFirstName = typeof firstName === "string" ? firstName : "";
        const safeLastName = typeof lastName === "string" ? lastName : "";
        const safeContactNumber = typeof contactNumber === "string" && contactNumber.trim() ? contactNumber.trim() : null;

        if (existingUser) {
            existingUser.set({
                preferredName,
                firstName: safeFirstName,
                lastName: safeLastName,
                password: hashedPassword,
                accountType,
                approved,
                verified: false,
            });
            if (!existingUser.image) existingUser.image = buildAvatarUrl(safeFirstName, safeLastName);
            await existingUser.save();
        } else {
            const profileDetails = await Profile.create({
                gender: null,
                dateOfBirth: null,
                about: null,
                contactNumber: safeContactNumber,
            });

            await User.create({
                preferredName,
                firstName: safeFirstName,
                lastName: safeLastName,
                email: emailNormalized,
                password: hashedPassword,
                accountType,
                additionalDetails: profileDetails._id,
                approved,
                verified: false,
                image: buildAvatarUrl(safeFirstName, safeLastName),
            });
        }

        return res.status(201).json({
            success: true,
            message: "Account created. Please verify your email with the OTP",
            email: emailNormalized,
        });
    } catch (error) {
        console.error("Error while registering user (signup):", error);
        return res.status(500).json({ success: false, message: "Failed to register user. Please try again later" });
    }
};

exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!isNonEmptyString(email)) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const emailNormalized = normalizeEmail(email);
        if (!EMAIL_PATTERN.test(emailNormalized)) {
            return res.status(400).json({ success: false, message: "Email is invalid" });
        }

        const existingUser = await User.findOne({ email: emailNormalized }).select("verified preferredName firstName");
        if (existingUser?.verified) {
            return res.status(409).json({ success: false, message: "User is already registered" });
        }

        const latestOtp = await OTP.findOne({ email: emailNormalized }).sort({ createdAt: -1 });
        if (latestOtp && Date.now() - latestOtp.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
            return res.status(429).json({
                success: false,
                message: "Please wait a minute before requesting another OTP",
            });
        }

        const otp = generateOtp();
        const name = existingUser?.preferredName || existingUser?.firstName || "";

        const mailResult = await mailSender.sendTemplate(emailNormalized, otpEmail({ name, otp, ttlMinutes: OTP_TTL_MINUTES }));
        if (!mailResult) {
            return res.status(502).json({ success: false, message: "Could not send the OTP email. Please try again" });
        }

        await OTP.deleteMany({ email: emailNormalized });
        await OTP.create({ email: emailNormalized, otpHash: hashOtp(emailNormalized, otp) });

        return res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        console.error("Error while generating OTP:", error);
        return res.status(500).json({ success: false, message: "Error while generating OTP" });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!isNonEmptyString(email) || !(isNonEmptyString(otp) || typeof otp === "number")) {
            return res.status(400).json({ success: false, message: "Missing required fields: email and otp" });
        }

        const emailNormalized = normalizeEmail(email);
        const otpValue = String(otp).trim();

        const user = await User.findOne({ email: emailNormalized });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }
        if (user.verified) {
            return res.status(400).json({ success: false, message: "User is already verified" });
        }

        const recentOtp = await OTP.findOne({ email: emailNormalized }).sort({ createdAt: -1 });
        if (!recentOtp || recentOtp.attempts >= OTP_MAX_ATTEMPTS) {
            await OTP.deleteMany({ email: emailNormalized });
            return res.status(400).json({ success: false, message: "OTP expired or too many attempts, please request a new one" });
        }

        if (!safeEqual(recentOtp.otpHash, hashOtp(emailNormalized, otpValue))) {
            await OTP.updateOne({ _id: recentOtp._id }, { $inc: { attempts: 1 } });
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        await User.updateOne({ _id: user._id }, { $set: { verified: true } });
        await OTP.deleteMany({ email: emailNormalized });

        await mailSender.sendTemplate(
            user.email,
            welcomeEmail({
                name: user.preferredName || user.firstName,
                accountType: user.accountType,
                isPendingApproval: user.accountType === "Instructor" && !user.approved,
            })
        );

        return res.status(200).json({
            success: true,
            message: "OTP verified. User is now verified",
            email: user.email,
        });
    } catch (error) {
        console.error("Error when trying validate OTP:", error);
        return res.status(500).json({ success: false, message: "Internal server error while verifying OTP" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const emailNormalized = normalizeEmail(email);
        const user = await User.findOne({ email: emailNormalized }).populate("additionalDetails");

        const passwordMatches = await bcrypt.compare(password, user ? user.password : DUMMY_PASSWORD_HASH);
        if (!user || !passwordMatches) {
            return res.status(401).json({ success: false, message: INVALID_CREDENTIALS_MESSAGE });
        }

        if (!user.verified) {
            return res.status(403).json({ success: false, message: "Please verify your email" });
        }
        if (!user.active) {
            return res.status(403).json({ success: false, message: "Account is deactivated" });
        }

        const token = signToken({ email: user.email, id: user._id, accountType: user.accountType }, JWT_EXPIRES);

        const safeUser = user.toObject();
        delete safeUser.password;
        delete safeUser.token;
        delete safeUser.resetPasswordTokenExpires;

        const cookieOptions = {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        };

        return res.cookie("token", token, cookieOptions).status(200).json({
            success: true,
            user: safeUser,
            token,
            message: "User logged in successfully",
        });
    } catch (error) {
        console.error("Error while logging in user:", error);
        return res.status(500).json({ success: false, message: "Error while logging in user" });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    return res.status(200).json({ success: true, message: "Logged out" });
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        if (!isNonEmptyString(oldPassword) || !isNonEmptyString(newPassword) || !isNonEmptyString(confirmNewPassword)) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ success: false, message: "New password and confirm password do not match" });
        }
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({ success: false, message: passwordError });
        }

        const userDetails = await User.findById(req.user.id);
        if (!userDetails) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!(await bcrypt.compare(oldPassword, userDetails.password))) {
            return res.status(401).json({ success: false, message: "Old password is incorrect" });
        }

        userDetails.password = await bcrypt.hash(newPassword, 10);
        userDetails.passwordChangedAt = new Date();
        await userDetails.save();

        await mailSender.sendTemplate(
            userDetails.email,
            passwordChangedEmail({ name: userDetails.preferredName || userDetails.firstName, at: userDetails.passwordChangedAt })
        );

        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error("Error while changing password:", error);
        return res.status(500).json({ success: false, message: "Error while changing password" });
    }
};
