const Profile = require("../models/Profile");
const asyncHandler = require("../utils/asyncHandler");

const profileFields = [
  "companyName",
  "address",
  "email",
  "country",
  "bankName",
  "accountNumber",
  "ifsc",
  "paymentEmail",
];

const sanitizeString = (value) => String(value || "").trim();

const getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) {
    res.json({
      profile: {
        companyName: "",
        address: "",
        email: "",
        country: "",
        bankName: "",
        accountNumber: "",
        ifsc: "",
        paymentEmail: "",
        logoUrl: "",
      },
    });
    return;
  }

  res.json({ profile });
});

const updateProfile = asyncHandler(async (req, res) => {
  const update = {};
  profileFields.forEach((field) => {
    if (field in req.body) {
      update[field] = sanitizeString(req.body[field]);
    }
  });

  if (req.file?.filename) {
    update.logoUrl = `/uploads/logos/${req.file.filename}`;
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: update, $setOnInsert: { userId: req.user._id } },
    { upsert: true, new: true }
  );

  res.json({
    message: "Profile saved successfully.",
    profile,
  });
});

module.exports = {
  getProfile,
  updateProfile,
};

