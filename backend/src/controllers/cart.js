// backend/src/controllers/cart.js
const User = require("../models/user");
const Course = require("../models/course");

/**
 * GET /cart
 * Auth required. Returns populated cart and totals.
 */
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).populate({
            path: "cart",
            select: "-__v -courseContent", // lightweight; customize as needed
            populate: [{ path: "category", select: "name" }],
        });

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const cart = user.cart || [];
        const total = cart.reduce((acc, c) => acc + (Number(c.price ?? 0)), 0);
        const totalItems = cart.length;

        return res.status(200).json({
            success: true,
            data: { cart, total, totalItems },
            message: "Cart fetched successfully",
        });
    } catch (err) {
        console.error("GET /cart error", err);
        return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
};

/**
 * POST /cart
 * Body: { courseId }
 * Adds course to user's cart (no duplicates)
 */
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.body;
        if (!courseId) return res.status(400).json({ success: false, message: "courseId required" });

        // check course exists
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // prevent duplicate
        const already = (user.cart || []).some((cId) => String(cId) === String(courseId));
        if (already) {
            return res.status(400).json({ success: false, message: "Course already in cart" });
        }

        user.cart = user.cart || [];
        user.cart.push(courseId);
        await user.save();

        // return populated cart
        const updatedUser = await User.findById(userId).populate({ path: "cart", populate: { path: "category", select: "name" } });
        const cart = updatedUser.cart || [];
        const total = cart.reduce((acc, c) => acc + (Number(c.price ?? 0)), 0);

        return res.status(200).json({
            success: true,
            data: { cart, total, totalItems: cart.length },
            message: "Course added to cart",
        });
    } catch (err) {
        console.error("POST /cart error", err);
        return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
};

/**
 * DELETE /cart/:courseId
 * Removes course from user's cart
 */
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;
        if (!courseId) return res.status(400).json({ success: false, message: "courseId required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.cart = (user.cart || []).filter((cId) => String(cId) !== String(courseId));
        await user.save();

        const updatedUser = await User.findById(userId).populate({ path: "cart", populate: { path: "category", select: "name" } });
        const cart = updatedUser.cart || [];
        const total = cart.reduce((acc, c) => acc + (Number(c.price ?? 0)), 0);

        return res.status(200).json({
            success: true,
            data: { cart, total, totalItems: cart.length },
            message: "Course removed from cart",
        });
    } catch (err) {
        console.error("DELETE /cart/:courseId error", err);
        return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
};

/**
 * POST /cart/clear
 * Clears user's cart
 */
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.cart = [];
        await user.save();

        return res.status(200).json({
            success: true,
            data: { cart: [], total: 0, totalItems: 0 },
            message: "Cart cleared",
        });
    } catch (err) {
        console.error("POST /cart/clear error", err);
        return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
};
