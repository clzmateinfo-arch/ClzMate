const jwt = require("jsonwebtoken");
require("dotenv-flow").config();

exports.auth = (req, res, next) => {
    try {
        const token =
            req.body?.token ||
            req.cookies?.token ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is Missing",
                code: "TOKEN_MISSING",
            });
        }

        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decode;
            next();
        } catch (error) {
            console.log("Error while decoding token");
            console.error(error);
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Token Expired",
                    code: "TOKEN_EXPIRED",
                    expiredAt: error.expiredAt || null,
                });
            }

            return res.status(401).json({
                success: false,
                message: "Invalid Token",
                code: "TOKEN_INVALID",
                error: error.message,
            });
        }
    } catch (error) {
        console.log("Error while token validating");
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error while token validating",
            error: error.message,
        });
    }
};

exports.isStudent = (req, res, next) => {
    try {
        if (req.user?.accountType !== "Student") {
            return res.status(403).json({
                success: false,
                message: "This page is protected only for Student",
                code: "FORBIDDEN",
            });
        }
        next();
    } catch (error) {
        console.log("Error while checking user validity with student accountType");
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error while checking user validity with student accountType",
            error: error.message,
        });
    }
};

exports.isInstructor = (req, res, next) => {
    try {
        if (req.user?.accountType !== "Instructor") {
            return res.status(403).json({
                success: false,
                message: "This page is protected only for Instructor",
                code: "FORBIDDEN",
            });
        }
        next();
    } catch (error) {
        console.log("Error while checking user validity with Instructor accountType");
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error while checking user validity with Instructor accountType",
            error: error.message,
        });
    }
};

exports.isAdmin = (req, res, next) => {
    try {
        if (req.user?.accountType !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "This page is protected only for Admin",
                code: "FORBIDDEN",
            });
        }
        next();
    } catch (error) {
        console.log("Error while checking user validity with Admin accountType");
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error while checking user validity with Admin accountType",
            error: error.message,
        });
    }
};
