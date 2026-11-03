const User = require("../models/user");
const mailSender = require("../utils/mailSender");
const { instructorApprovedEmail } = require("../mail/templates");
const { deleteUserWithData } = require("../utils/userCleanup");
const { isObjectId, buildSearchRegex, sendServerError } = require("../utils/validators");

const ACCOUNT_TYPES = ["Admin", "Instructor", "Student"];
const SENSITIVE_USER_FIELDS = "-password -resetPasswordTokenExpires -token";
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

exports.getAllUsers = async (req, res) => {
    try {
        const { q = "", page, limit } = req.body || {};

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

        const filter = {};
        const searchRegex = buildSearchRegex(q);
        if (searchRegex) {
            filter.$or = [{ email: searchRegex }, { firstName: searchRegex }, { lastName: searchRegex }, { preferredName: searchRegex }];
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select(SENSITIVE_USER_FIELDS)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        return res.status(200).json({ success: true, data: { users, total, page: pageNum, limit: pageSize } });
    } catch (error) {
        return sendServerError(res, "getAllUsers", error, "Server error");
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { userId, accountType, active, approved } = req.body || {};
        if (!isObjectId(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }
        if (accountType !== undefined && !ACCOUNT_TYPES.includes(accountType)) {
            return res.status(400).json({ success: false, message: "Invalid accountType" });
        }
        if ((active !== undefined && typeof active !== "boolean") || (approved !== undefined && typeof approved !== "boolean")) {
            return res.status(400).json({ success: false, message: "active and approved must be boolean" });
        }

        const update = {};
        if (accountType !== undefined) update.accountType = accountType;
        if (active !== undefined) update.active = active;
        if (approved !== undefined) update.approved = approved;

        if (String(userId) === String(req.user.id) && (accountType !== undefined && accountType !== "Admin" || active === false)) {
            return res.status(400).json({ success: false, message: "You cannot demote or deactivate your own account" });
        }

        const previous = await User.findById(userId).select("accountType approved").lean();
        if (!previous) return res.status(404).json({ success: false, message: "User not found" });

        const updated = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true })
            .select(SENSITIVE_USER_FIELDS)
            .lean();
        if (!updated) return res.status(404).json({ success: false, message: "User not found" });

        const isApprovedInstructor = (user) => user.accountType === "Instructor" && user.approved === true;
        if (isApprovedInstructor(updated) && !isApprovedInstructor(previous)) {
            await mailSender.sendTemplate(updated.email, instructorApprovedEmail({ name: updated.preferredName || updated.firstName }));
        }

        return res.status(200).json({ success: true, data: updated, message: "User updated" });
    } catch (error) {
        return sendServerError(res, "updateUser", error, "Server error");
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.body || {};
        if (!isObjectId(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }
        if (String(userId) === String(req.user.id)) {
            return res.status(400).json({ success: false, message: "You cannot delete your own account" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const result = await deleteUserWithData(user);
        if (!result.deleted) {
            return res.status(409).json({ success: false, message: result.reason });
        }

        return res.status(200).json({ success: true, message: "User deleted", data: user._id });
    } catch (error) {
        return sendServerError(res, "deleteUser", error, "Server error");
    }
};
