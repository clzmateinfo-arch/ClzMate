const express = require("express");
const router = express.Router();
const { getHealth, getPublicSnapshot } = require("../controllers/snapshot");

router.get("/health", getHealth);
router.get("/snapshot", getPublicSnapshot);

module.exports = router;
