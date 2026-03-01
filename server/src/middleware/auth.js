const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Unauthorized", 401);
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await User.findById(decoded.userId).select("-passwordHash");
  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  req.user = user;
  next();
});

module.exports = { protect };

