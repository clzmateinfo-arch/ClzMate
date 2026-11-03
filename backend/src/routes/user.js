const express = require("express");
const router = express.Router();
const { signup, login, logout, sendOTP, changePassword, verifyOTP } = require("../controllers/auth");
const { resetPasswordToken, resetPassword } = require("../controllers/resetPassword");
const { auth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/sendotp", authLimiter, sendOTP);
router.post("/verifyotp", authLimiter, verifyOTP);
router.post("/changepassword", auth, changePassword);

router.post("/reset-password-token", authLimiter, resetPasswordToken);
router.post("/reset-password", authLimiter, resetPassword);

module.exports = router;
