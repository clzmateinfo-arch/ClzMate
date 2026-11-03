const User = require("../models/user");
const Course = require("../models/course");
const { isObjectId, sendServerError } = require("../utils/validators");

const CART_POPULATION = {
    path: "cart",
    select: "-__v -courseContent -enrollmentRequests",
    populate: [{ path: "category", select: "name" }],
};

async function buildCartPayload(userId) {
    const user = await User.findById(userId).populate(CART_POPULATION);
    if (!user) return null;
    const cart = user.cart || [];
    const total = cart.reduce((sum, course) => sum + (Number(course.price) || 0), 0);
    return { cart, total, totalItems: cart.length };
}

async function respondWithCart(res, userId, message) {
    const data = await buildCartPayload(userId);
    if (!data) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data, message });
}

exports.getCart = async (req, res) => {
    try {
        return await respondWithCart(res, req.user.id, "Cart fetched successfully");
    } catch (error) {
        return sendServerError(res, "GET /cart error", error, "Server error");
    }
};

exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.body || {};
        if (!isObjectId(courseId)) return res.status(400).json({ success: false, message: "Valid courseId required" });

        const course = await Course.findOne({ _id: courseId, status: "Published" }).select("studentsEnrolled");
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        if (course.studentsEnrolled.some((studentId) => String(studentId) === String(userId))) {
            return res.status(400).json({ success: false, message: "Already enrolled in this course" });
        }

        const added = await User.updateOne({ _id: userId, cart: { $ne: courseId } }, { $addToSet: { cart: courseId } });
        if (added.modifiedCount === 0) {
            const exists = await User.exists({ _id: userId });
            if (!exists) return res.status(404).json({ success: false, message: "User not found" });
            return res.status(400).json({ success: false, message: "Course already in cart" });
        }

        return await respondWithCart(res, userId, "Course added to cart");
    } catch (error) {
        return sendServerError(res, "POST /cart error", error, "Server error");
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;
        if (!isObjectId(courseId)) return res.status(400).json({ success: false, message: "Valid courseId required" });

        await User.updateOne({ _id: userId }, { $pull: { cart: courseId } });

        return await respondWithCart(res, userId, "Course removed from cart");
    } catch (error) {
        return sendServerError(res, "DELETE /cart/:courseId error", error, "Server error");
    }
};

exports.clearCart = async (req, res) => {
    try {
        const cleared = await User.updateOne({ _id: req.user.id }, { $set: { cart: [] } });
        if (cleared.matchedCount === 0) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({
            success: true,
            data: { cart: [], total: 0, totalItems: 0 },
            message: "Cart cleared",
        });
    } catch (error) {
        return sendServerError(res, "POST /cart/clear error", error, "Server error");
    }
};
