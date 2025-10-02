const Classroom = require("../models/Classroom");
const User = require("../models/User");
const crypto = require("crypto");
const mongoose = require("mongoose");

function makeInviteCode() {
    return crypto.randomBytes(4).toString("hex");
}

exports.createClassroom = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "Title required" });

        const owner = req.user.id;
        const inviteCode = makeInviteCode();

        const classroom = await Classroom.create({
            title,
            description: description || "",
            owner,
            inviteCode,
            members: [{ user: owner, role: "Instructor" }],
            coInstructors: [],
        });

        return res.status(200).json({ success: true, data: classroom });
    } catch (err) {
        console.error("createClassroom", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMyClassrooms = async (req, res) => {
    try {
        const userId = req.user.id;
        const type = String(req.query.type || "all").toLowerCase();
        const page = Math.max(1, parseInt(req.query.page || "1", 10));
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "6", 10)));
        const search = (req.query.search || "").trim();

        const match = {};
        if (type === "owned") {
            match.owner = userId;
        } else if (type === "joined") {
            match.$and = [
                { owner: { $ne: userId } },
                {
                    $or: [
                        { "members.user": userId },
                        { coInstructors: userId },
                        { guests: userId },
                    ],
                },
            ];
        } else {
            match.$or = [
                { owner: userId },
                { "members.user": userId },
                { coInstructors: userId },
                { guests: userId },
            ];
        }

        if (search) {
            match.title = { $regex: search, $options: "i" };
        }

        const total = await Classroom.countDocuments(match);
        const skip = (page - 1) * limit;

        const classrooms = await Classroom.find(match)
            .sort({ "meta.updatedAt": -1, "meta.createdAt": -1 })
            .skip(skip)
            .limit(limit)
            .populate("owner", "firstName lastName email image")
            .populate("members.user", "firstName lastName email image")
            .lean();

        return res.status(200).json({
            success: true,
            data: classrooms,
            total,
            page,
            limit,
        });
    } catch (err) {
        console.error("getMyClassrooms", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getClassroom = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid id" });

        const classroom = await Classroom.findById(id)
            .populate("owner", "firstName lastName email image")
            .populate("members.user", "firstName lastName email image")
            .lean();

        if (!classroom) return res.status(404).json({ success: false, message: "Not found" });
        return res.status(200).json({ success: true, data: classroom });
    } catch (err) {
        console.error("getClassroom", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.joinByInviteCode = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode) return res.status(400).json({ success: false, message: "inviteCode required" });
        const userId = req.user.id;

        const classroom = await Classroom.findOne({ inviteCode });
        if (!classroom) return res.status(404).json({ success: false, message: "Invalid invite code" });

        const already = classroom.members.find(m => String(m.user) === String(userId));
        if (already) return res.status(200).json({ success: true, message: "Already a member", data: classroom });

        const user = await User.findById(userId).lean();
        let roleToAssign = "Student";

        if (user && user.accountType === "Instructor") {
            if (String(classroom.owner) !== String(userId)) {
                roleToAssign = "CoInstructor";
            } else {
                roleToAssign = "Instructor";
            }
        } else {
            roleToAssign = "Student";
        }

        classroom.members.push({ user: userId, role: roleToAssign });

        if (roleToAssign === "CoInstructor") {
            const existsInCo = classroom.coInstructors && classroom.coInstructors.find(ci => String(ci) === String(userId));
            if (!existsInCo) classroom.coInstructors.push(userId);
        }

        await classroom.save();

        return res.status(200).json({ success: true, data: classroom });
    } catch (err) {
        console.error("joinByInviteCode", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.addMember = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { userIdToAdd } = req.body;
        if (!mongoose.Types.ObjectId.isValid(classroomId)) return res.status(400).json({ success: false, message: "Invalid id" });
        if (!mongoose.Types.ObjectId.isValid(userIdToAdd)) return res.status(400).json({ success: false, message: "Invalid userId" });

        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ success: false, message: "Not found" });

        if (String(req.user.id) !== String(classroom.owner) && classroom.members.every(m => String(m.user) !== String(req.user.id) || m.role === "Student")) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const exists = classroom.members.find(m => String(m.user) === String(userIdToAdd));
        if (exists) return res.status(200).json({ success: true, message: "Already a member", data: classroom });

        const userToAdd = await User.findById(userIdToAdd).lean();
        let role = "Student";
        if (userToAdd && userToAdd.accountType === "Instructor") {
            if (String(classroom.owner) !== String(userIdToAdd)) role = "CoInstructor";
            else role = "Instructor";
        }

        classroom.members.push({ user: userIdToAdd, role });
        if (role === "CoInstructor") {
            const existsInCo = classroom.coInstructors && classroom.coInstructors.find(ci => String(ci) === String(userIdToAdd));
            if (!existsInCo) classroom.coInstructors.push(userIdToAdd);
        }

        await classroom.save();

        return res.status(200).json({ success: true, data: classroom });
    } catch (err) {
        console.error("addMember", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { userIdToRemove } = req.body;
        if (!mongoose.Types.ObjectId.isValid(classroomId)) return res.status(400).json({ success: false, message: "Invalid id" });

        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ success: false, message: "Not found" });

        if (String(req.user.id) !== String(classroom.owner)) return res.status(403).json({ success: false, message: "Forbidden" });

        classroom.members = classroom.members.filter(m => String(m.user) !== String(userIdToRemove));
        classroom.coInstructors = classroom.coInstructors.filter(c => String(c) !== String(userIdToRemove));
        classroom.guests = classroom.guests.filter(g => String(g) !== String(userIdToRemove));
        await classroom.save();

        return res.status(200).json({ success: true, data: classroom });
    } catch (err) {
        console.error("removeMember", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
