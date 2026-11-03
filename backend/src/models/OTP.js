const mongoose = require("mongoose");
const createModel = require("../utils/createModel");

const OTP_TTL_SECONDS = 5 * 60;

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    otpHash: {
        type: String,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: OTP_TTL_SECONDS,
    },
});

module.exports = createModel("OTP", OTPSchema);
module.exports.OTP_TTL_SECONDS = OTP_TTL_SECONDS;
