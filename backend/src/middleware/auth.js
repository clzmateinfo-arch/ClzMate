const { verifyToken } = require("../utils/jwt");
require("dotenv-flow").config();

function extractTokenFromReq(req) {
  let token = req.body?.token || req.cookies?.token || req.header("Authorization") || "";

  if (typeof token === "string") {
    token = token.trim();
    if (token.toLowerCase().startsWith("bearer ")) {
      token = token.slice(7).trim();
    }
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      token = token.slice(1, -1);
    }
  }

  return token || null;
}

exports.auth = (req, res, next) => {
  try {
    const token = extractTokenFromReq(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is Missing",
      });
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      return next();
    } catch (err) {
      console.log("JWT verify failed:", err && err.message);
      return res.status(401).json({
        success: false,
        message: "Error while decoding token",
        error: err?.message || "Error while decoding token",
      });
    }
  } catch (error) {
    console.log("Error while token validating", error);
    return res.status(500).json({
      success: false,
      message: "Error while token validating",
    });
  }
};

exports.isStudent = (req, res, next) => {
  try {
    if (req.user?.accountType != "Student") {
      return res.status(401).json({
        success: false,
        message: "This Page is protected only for student",
      });
    }
    next();
  } catch (error) {
    console.log("Error while cheching user validity with student accountType");
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while cheching user validity with student accountType",
      error: error.message,
    });
  }
};

exports.isInstructor = (req, res, next) => {
  try {
    if (req.user?.accountType != "Instructor") {
      return res.status(401).json({
        success: false,
        message: "This Page is protected only for Instructor",
      });
    }
    next();
  } catch (error) {
    console.log(
      "Error while cheching user validity with Instructor accountType"
    );
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while cheching user validity with Instructor accountType",
      error: error.message,
    });
  }
};

exports.isAdmin = (req, res, next) => {
  try {
    if (req.user.accountType != "Admin") {
      return res.status(401).json({
        success: false,
        message: "This Page is protected only for Admin",
      });
    }
    next();
  } catch (error) {
    console.log("Error while cheching user validity with Admin accountType");
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while cheching user validity with Admin accountType",
      error: error.message,
    });
  }
};
