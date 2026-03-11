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

const createVerificationToken = async (userId) => {
  await VerificationToken.deleteMany({ userId });
  const token = crypto.randomBytes(32).toString("hex");
  await VerificationToken.create({
    userId,
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });
  return token;
};

const normalizeBaseUrl = (value, fallback = "") => {
  const normalized = String(value || "")
    .trim()
    .replace(/\/+$/, "");
  return normalized || fallback;
};

const getClientRedirectUrl = (status, message) => {
  const clientBaseUrl = normalizeBaseUrl(process.env.CLIENT_URL, "http://localhost:5173");
  const params = new URLSearchParams({ verified: status });
  if (message) {
    params.set("message", message);
  }
  return `${clientBaseUrl}/?${params.toString()}`;
};

const verifyUserEmailByToken = async (token) => {
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

  return "Email verified successfully. You can now log in.";
};

const queueVerificationEmail = async ({ to, username, token }) => {
  // eslint-disable-next-line no-console
  console.info(`Verification email queued for ${to}`);

  try {
    await sendVerificationEmail({
      to,
      username,
      token,
    });
    // eslint-disable-next-line no-console
    console.info(`Verification email sent to ${to}`);
    return "sent";
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Verification email failed for ${to}: ${error.message}`);
    return "queued";
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

  const token = await createVerificationToken(user._id);
  queueVerificationEmail({
    to: user.email,
    username: user.username,
    token,
  });

  res.status(201).json({
    message: "Registration successful. Please verify your email before logging in.",
    deliveryStatus: "queued",
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.body.token || req.query.token;
  const message = await verifyUserEmailByToken(token);
  res.json({ message });
});

const verifyEmailRedirect = asyncHandler(async (req, res) => {
  const token = req.query.token;

  try {
    const message = await verifyUserEmailByToken(token);
    res.redirect(getClientRedirectUrl("success", message));
  } catch (error) {
    const fallback = "Verification failed.";
    const message = error instanceof Error ? error.message : fallback;
    res.redirect(getClientRedirectUrl("error", message || fallback));
  }
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

const resendVerification = asyncHandler(async (req, res) => {
  const normalizedEmail = String(req.body.email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail) {
    throw new AppError("Email is required.", 400);
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.json({
      message: "If this account exists and is unverified, a verification email has been sent.",
      deliveryStatus: "queued",
    });
    return;
  }

  if (user.verified) {
    res.json({
      message: "Account is already verified. Please log in.",
      deliveryStatus: "already_verified",
    });
    return;
  }

  const token = await createVerificationToken(user._id);
  queueVerificationEmail({
    to: user.email,
    username: user.username,
    token,
  });

  res.json({
    message: "Verification email request accepted. Please check your inbox.",
    deliveryStatus: "queued",
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = {
  register,
  verifyEmail,
  verifyEmailRedirect,
  login,
  resendVerification,
  getMe,
};
