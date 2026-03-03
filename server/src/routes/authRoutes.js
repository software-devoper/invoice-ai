const express = require("express");
const {
  register,
  verifyEmail,
  verifyEmailRedirect,
  login,
  resendVerification,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.get("/verify-email", verifyEmailRedirect);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", login);
router.get("/me", protect, getMe);

module.exports = router;
