const AppError = require("../utils/AppError");

const normalizeError = (error) => {
  if (error instanceof AppError) return error;

  if (error.name === "ValidationError") {
    return new AppError(Object.values(error.errors)[0]?.message || "Validation error", 400);
  }

  if (error.code === 11000) {
    const key = Object.keys(error.keyPattern || {})[0] || "field";
    return new AppError(`Duplicate value for ${key}`, 409);
  }

  if (error.name === "MulterError") {
    return new AppError(error.message, 400);
  }

  return new AppError(error.message || "Internal server error", error.statusCode || 500);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, _req, res, _next) => {
  const normalized = normalizeError(error);
  const statusCode = normalized.statusCode || 500;

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error("Server error:", error);
  }

  res.status(statusCode).json({
    message: normalized.message,
    ...(process.env.NODE_ENV !== "production" ? { stack: error.stack } : {}),
  });
};

module.exports = errorHandler;
