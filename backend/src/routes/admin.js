const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  deleteUser
} = require("../controllers/user");

const { publishSnapshot, getSnapshotStatus } = require("../controllers/snapshot");

const {
    auth,
    isAdmin,
} = require("../middleware/auth");

router.post("/snapshot/publish", auth, isAdmin, publishSnapshot);
router.get("/snapshot/status", auth, isAdmin, getSnapshotStatus);
router.post("/getAllUsers", auth, isAdmin, getAllUsers);
router.post("/updateUser", auth, isAdmin, updateUser);
router.post("/deleteUser", auth, isAdmin, deleteUser);

module.exports = router;
