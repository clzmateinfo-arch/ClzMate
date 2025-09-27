// backend/src/routes/cart.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { getCart, addToCart, removeFromCart, clearCart } = require("../controllers/cart");

// all authenticated
router.get("/", auth, getCart);
router.post("/", auth, addToCart);
router.delete("/:courseId", auth, removeFromCart);
router.post("/clear", auth, clearCart);

module.exports = router;
