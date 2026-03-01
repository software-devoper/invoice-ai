const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendVerificationEmail } = require("../services/emailService");

const generateJwt = (user) =>
  jwt.sign(
    {
      userId: user._id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const validateRegistrationFields = ({ username, email, password }) => {
  if (!username || !email || !password) {
    throw new AppError("Username, email, and password are required.", 400);
  }

  if (String(password).length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailValid) {
    throw new AppError("Please provide a valid email address.", 400);
  }
};

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  validateRegistrationFields({ username, email, password });

  const normalizedUsername = String(username).trim();
  const normalizedEmail = String(email).trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });
  if (existingUser) {
    throw new AppError("Username or email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    verified: false,
  });

  const token = crypto.randomBytes(32).toString("hex");
  await VerificationToken.create({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });

  await sendVerificationEmail({
    to: user.email,
    username: user.username,
    token,
  });

  res.status(201).json({
    message: "Registration successful. Please verify your email before logging in.",
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.body.token || req.query.token;
  if (!token) throw new AppError("Verification token is required.", 400);

  const tokenDoc = await VerificationToken.findOne({ token });
  if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
    throw new AppError("Invalid or expired verification token.", 400);
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  user.verified = true;
  await user.save();
  await VerificationToken.deleteMany({ userId: user._id });

  res.json({ message: "Email verified successfully. You can now log in." });
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    throw new AppError("Username and password are required.", 400);
  }

  const user = await User.findOne({ username: String(username).trim() });
  if (!user) {
    throw new AppError("Invalid credentials.", 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError("Invalid credentials.", 401);
  }

  if (!user.verified) {
    throw new AppError("Please verify your email before logging in.", 403);
  }

  const token = generateJwt(user);
  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      verified: user.verified,
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = {
  register,
  verifyEmail,
  login,
  getMe,
};

