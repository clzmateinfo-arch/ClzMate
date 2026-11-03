const { verifyToken } = require("../utils/jwt");
const User = require("../models/user");
require("dotenv-flow").config();

function extractTokenFromReq(req) {
  let token = req.header("Authorization") || req.cookies?.token || req.body?.token || "";

  if (typeof token !== "string") return null;

  token = token.trim();
  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice(7).trim();
  }
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1);
  }

  return token || null;
}

const rejectUnauthorized = (res, message) => res.status(401).json({ success: false, message });

exports.auth = async (req, res, next) => {
  const token = extractTokenFromReq(req);
  if (!token) return rejectUnauthorized(res, "Token is Missing");

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    return rejectUnauthorized(res, "Error while decoding token");
  }

  try {
    const user = await User.findById(decoded.id).select("email accountType active approved passwordChangedAt");
    if (!user || !user.active) return rejectUnauthorized(res, "Account not found or deactivated");

    const passwordChangedAtSeconds = user.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : 0;
    if ((decoded.iat || 0) < passwordChangedAtSeconds) {
      return rejectUnauthorized(res, "Session expired after password change, please log in again");
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      accountType: user.accountType,
      approved: user.approved,
    };
    return next();
  } catch (error) {
    console.error("Error while validating token:", error);
    return res.status(500).json({ success: false, message: "Error while validating token" });
  }
};

const requireRole = (accountType, label) => (req, res, next) => {
  if (req.user?.accountType !== accountType) {
    return res.status(403).json({ success: false, message: `This Page is protected only for ${label}` });
  }
  return next();
};

exports.isStudent = requireRole("Student", "student");
exports.isAdmin = requireRole("Admin", "Admin");

exports.isInstructor = (req, res, next) => {
  if (req.user?.accountType !== "Instructor") {
    return res.status(403).json({ success: false, message: "This Page is protected only for Instructor" });
  }
  if (!req.user.approved) {
    return res.status(403).json({ success: false, message: "Instructor account is pending admin approval" });
  }
  return next();
};
