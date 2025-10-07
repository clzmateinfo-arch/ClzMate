const jwt = require("jsonwebtoken");
require("dotenv-flow").config();

const DEFAULT_EXPIRES = process.env.JWT_EXPIRES || "24h";

function ensureSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error("Missing JWT_SECRET environment variable");
    }
    return process.env.JWT_SECRET;
}


function signToken(payload, expiresIn = DEFAULT_EXPIRES) {
    const secret = ensureSecret();
    return jwt.sign(payload, secret, { expiresIn });
}


function verifyToken(token) {
    const secret = ensureSecret();
    return jwt.verify(token, secret);
}

function decodeToken(token) {
    try {
        return jwt.decode(token, { complete: true });
    } catch (e) {
        return null;
    }
}

module.exports = {
    signToken,
    verifyToken,
    decodeToken,
    DEFAULT_EXPIRES,
};
