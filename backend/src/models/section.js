const mongoose = require("mongoose");
const createModel = require('../utils/createModel');

const sectionSchema = new mongoose.Schema({
    sectionName: {
        type: String,
    },
    subSection: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubSection",
            required: true,
        },
    ],
});

module.exports = createModel("Section", sectionSchema);
