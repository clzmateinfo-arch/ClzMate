const express = require("express");
const router = express.Router();
const { getSiteStats } = require("../controllers/stats");

router.get("/stats", getSiteStats);

module.exports = router;
