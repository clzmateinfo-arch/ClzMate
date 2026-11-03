const crypto = require("crypto");
const Classroom = require("../models/classroom");
const User = require("../models/user");
const { escapeRegex, isNonEmptyString } = require("../middleware/sanitize");
const {
    HttpError,
    isValidId,
    assertValidId,
    sendError,
    getRoleInClassroom,
    resolveRole,
    assertMember,
    assertStaff,
    isStaffRole,
    loadClassroomOrFail,
    serializeClassroomForViewer,
} = require("../utils/classroomAccess");

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const USER_PUBLIC_FIELDS = "firstName lastName email image";

const makeInviteCode = () => crypto.randomBytes(8).toString("hex");

const parsePositiveInt = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

exports.createClassroom = async (req, res) => {
    try {
        const { title, description } = req.body || {};
        if (!isNonEmptyString(title) || title.trim().length > MAX_TITLE_LENGTH) {
            return res.status(400).json({ success: false, message: "Title required" });
        }
        if (description !== undefined && (typeof description !== "string" || description.length > MAX_DESCRIPTION_LENGTH)) {
            return res.status(400).json({ success: false, message: "Invalid description" });
        }

        const owner = req.user.id;
        const classroom = await Classroom.create({
            title: title.trim(),
            description: description || "",
            owner,
            inviteCode: makeInviteCode(),
            members: [{ user: owner, role: "Instructor" }],
            coInstructors: [],
        });

        return res.status(200).json({ success: true, data: classroom });
    } catch (error) {
        return sendError(res, error, "createClassroom");
    }
};

exports.getMyClassrooms = async (req, res) => {
    try {
        const userId = req.user.id;
        const type = String(req.query.type || "all").toLowerCase();
        const page = parsePositiveInt(req.query.page, 1);
        const limit = Math.min(100, parsePositiveInt(req.query.limit, 6));
        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

        const involvement = [
            { owner: userId },
            { "members.user": userId },
            { coInstructors: userId },
            { guests: userId },
        ];
        const match = {};
        if (type === "owned") {
            match.owner = userId;
        } else if (type === "joined") {
            match.$and = [{ owner: { $ne: userId } }, { $or: involvement.slice(1) }];
        } else {
            match.$or = involvement;
        }
        if (search) match.title = { $regex: escapeRegex(search), $options: "i" };

        const total = await Classroom.countDocuments(match);
        const classrooms = await Classroom.find(match)
            .sort({ "meta.updatedAt": -1, "meta.createdAt": -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("owner", USER_PUBLIC_FIELDS)
            .populate("members.user", USER_PUBLIC_FIELDS)
            .lean();

        const data = classrooms.map((classroom) =>
            serializeClassroomForViewer(classroom, isStaffRole(resolveRole(classroom, req.user)))
        );

        return res.status(200).json({ success: true, data, total, page, limit });
    } catch (error) {
        return sendError(res, error, "getMyClassrooms");
    }
};

exports.getClassroom = async (req, res) => {
    try {
        const classroom = await loadClassroomOrFail(req.params.id);
        const role = assertMember(classroom, req.user);
        await classroom.populate([
            { path: "owner", select: USER_PUBLIC_FIELDS },
            { path: "members.user", select: USER_PUBLIC_FIELDS },
        ]);
        return res.status(200).json({ success: true, data: serializeClassroomForViewer(classroom, isStaffRole(role)) });
    } catch (error) {
        return sendError(res, error, "getClassroom");
    }
};

exports.joinByInviteCode = async (req, res) => {
    try {
        const { inviteCode } = req.body || {};
        if (!isNonEmptyString(inviteCode)) {
            return res.status(400).json({ success: false, message: "inviteCode required" });
        }
        const userId = req.user.id;

        const classroom = await Classroom.findOne({ inviteCode: inviteCode.trim() });
        if (!classroom) return res.status(404).json({ success: false, message: "Invalid invite code" });

        if (getRoleInClassroom(classroom, userId)) {
            return res.status(200).json({
                success: true,
                message: "Already a member",
                data: serializeClassroomForViewer(classroom, false),
            });
        }

        const updated = await Classroom.findOneAndUpdate(
            { _id: classroom._id, "members.user": { $ne: userId } },
            { $push: { members: { user: userId, role: "Student" } }, $set: { "meta.updatedAt": new Date() } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            data: serializeClassroomForViewer(updated || classroom, false),
        });
    } catch (error) {
        return sendError(res, error, "joinByInviteCode");
    }
};

exports.addMember = async (req, res) => {
    try {
        const { userIdToAdd } = req.body || {};
        const classroom = await loadClassroomOrFail(req.params.id);
        const actorRole = assertStaff(classroom, req.user);
        if (!isValidId(userIdToAdd)) return res.status(400).json({ success: false, message: "Invalid userId" });

        const userToAdd = await User.findById(userIdToAdd).select("accountType").lean();
        if (!userToAdd) return res.status(404).json({ success: false, message: "User not found" });

        const isOwnerLevelActor = actorRole === "owner" || actorRole === "admin";
        const shouldBeCoInstructor = isOwnerLevelActor && userToAdd.accountType === "Instructor";

        const existing = classroom.members.find((entry) => String(entry.user) === String(userIdToAdd));
        if (String(classroom.owner) === String(userIdToAdd)) {
            return res.status(200).json({ success: true, message: "Already a member", data: classroom });
        }
        if (existing && !(shouldBeCoInstructor && existing.role !== "CoInstructor")) {
            return res.status(200).json({ success: true, message: "Already a member", data: classroom });
        }

        if (existing) {
            existing.role = "CoInstructor";
        } else {
            classroom.members.push({ user: userIdToAdd, role: shouldBeCoInstructor ? "CoInstructor" : "Student" });
        }
        if (shouldBeCoInstructor && !classroom.coInstructors.some((id) => String(id) === String(userIdToAdd))) {
            classroom.coInstructors.push(userIdToAdd);
        }
        classroom.meta.updatedAt = new Date();
        await classroom.save();

        return res.status(200).json({ success: true, data: classroom });
    } catch (error) {
        return sendError(res, error, "addMember");
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { userIdToRemove } = req.body || {};
        const classroom = await loadClassroomOrFail(req.params.id);
        const actorRole = assertStaff(classroom, req.user);
        assertValidId(userIdToRemove, "userId");

        if (String(classroom.owner) === String(userIdToRemove)) {
            throw new HttpError(400, "The classroom owner cannot be removed");
        }
        const targetRole = getRoleInClassroom(classroom, userIdToRemove);
        if (!targetRole) throw new HttpError(404, "User is not part of this classroom");
        if (targetRole === "coInstructor" && actorRole !== "owner" && actorRole !== "admin") {
            throw new HttpError(403, "Only the owner can remove a co-instructor");
        }

        classroom.members = classroom.members.filter((entry) => String(entry.user) !== String(userIdToRemove));
        classroom.coInstructors = classroom.coInstructors.filter((id) => String(id) !== String(userIdToRemove));
        classroom.guests = classroom.guests.filter((id) => String(id) !== String(userIdToRemove));
        classroom.meta.updatedAt = new Date();
        await classroom.save();

        return res.status(200).json({ success: true, data: classroom });
    } catch (error) {
        return sendError(res, error, "removeMember");
    }
};
