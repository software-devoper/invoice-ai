const fs = require("fs");
const path = require("path");
const multer = require("multer");
const AppError = require("../utils/AppError");

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 5);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
const logoDir = path.join(uploadsDir, "logos");
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

const salesStorage = multer.memoryStorage();

const salesFileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [".csv", ".xlsx", ".xls"];
  if (!allowedExt.includes(ext)) {
    cb(new AppError("Only .csv, .xlsx, and .xls files are allowed.", 400));
    return;
  }
  cb(null, true);
};

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const logoFileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new AppError("Only image files are allowed for logo upload.", 400));
    return;
  }
  cb(null, true);
};

const uploadSalesFile = multer({
  storage: salesStorage,
  fileFilter: salesFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: logoFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

module.exports = { uploadSalesFile, uploadLogo };

