const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");

exports.getAllUsers = async (req, res) => {
    try {
        const { q = "", page = 1, limit = 50 } = req.body || {};
        const filter = {};
        if (q && String(q).trim()) {
            const re = new RegExp(String(q).trim(), "i");
            filter.$or = [{ email: re }, { firstName: re }, { lastName: re }, { preferredName: re }];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select("-password -resetPasswordTokenExpires -token")
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ success: true, data: { users, total, page: Number(page), limit: Number(limit) } });
    } catch (err) {
        console.error("getAllUsers", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { userId, accountType, active, approved } = req.body;
        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }

        const update = {};
        if (accountType) update.accountType = accountType;
        if (typeof active === "boolean") update.active = active;
        if (typeof approved === "boolean") update.approved = approved;

        const updated = await User.findByIdAndUpdate(userId, update, { new: true }).select("-password").lean();
        if (!updated) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({ success: true, data: updated, message: "User updated" });
    } catch (err) {
        console.error("updateUser", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }
        const deleted = await User.findByIdAndDelete(userId).lean();
        if (!deleted) return res.status(404).json({ success: false, message: "User not found" });
        return res.status(200).json({ success: true, message: "User deleted", data: deleted._id });
    } catch (err) {
        console.error("deleteUser", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
