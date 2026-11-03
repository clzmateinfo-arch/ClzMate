const rateLimit = require("express-rate-limit");

const isTest = () => process.env.NODE_ENV === "test";

const buildLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isTest,
    handler: (req, res) => res.status(429).json({ success: false, message }),
  });

exports.globalLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: "Too many requests, please try again later",
});

exports.authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many attempts, please try again later",
});
