const express = require("express");
const rateLimit = require("express-rate-limit");
const { submitContact } = require("../controllers/contact");

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: (req, res) => res.status(429).json({ success: false, message: "Too many messages, please try again later" }),
});

router.post("/contact", contactLimiter, submitContact);

module.exports = router;
