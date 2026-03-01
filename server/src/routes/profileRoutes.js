const express = require("express");
const { getProfile, updateProfile } = require("../controllers/profileController");
const { protect } = require("../middleware/auth");
const { uploadLogo } = require("../middleware/upload");

const router = express.Router();

router.get("/", protect, getProfile);
router.put("/", protect, uploadLogo.single("logo"), updateProfile);

module.exports = router;

