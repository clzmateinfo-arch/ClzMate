const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const profileSchema = new mongoose.Schema({
    gender: {
        type: String,
    },
    dateOfBirth: {
        type: String,
    },
    about: {
        type: String,
        trim: true,
    },
    contactNumber: {
        type: String,
        trim: true,
    },
    protectMe: {
        type: Boolean,
        default: false,
    },
});

module.exports = createModel("Profile", profileSchema);
