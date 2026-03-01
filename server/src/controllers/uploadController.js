const { randomUUID } = require("crypto");
const Customer = require("../models/Customer");
const Profile = require("../models/Profile");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { parseSpreadsheetBuffer } = require("../utils/fileParser");
const { analyzeSalesData, REQUIRED_ERROR_MESSAGE } = require("../utils/salesDataValidator");
const { getPendingCustomers, sendInvoicesForCustomers } = require("../services/invoiceService");

const parseAndStoreSalesData = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    throw new AppError("A CSV/XLSX file is required.", 400);
  }

  const rows = parseSpreadsheetBuffer(req.file.buffer);
  const analysis = analyzeSalesData(rows);

  if (!analysis.valid) {
    throw new AppError(REQUIRED_ERROR_MESSAGE, 400);
  }

  const batchId = randomUUID();
  const docs = analysis.cleanedRows.map((row) => ({
    userId: req.user._id,
    batchId,
    ...row,
    sent: false,
    sentDate: null,
  }));

  const customers = await Customer.insertMany(docs);

  res.status(201).json({
    message: "File validated and customer sales data saved.",
    batchId,
    customers,
    meta: {
      totalRows: rows.length,
      validRows: analysis.cleanedRows.length,
      validRatio: analysis.validRatio,
    },
  });
});

const updateCustomers = asyncHandler(async (req, res) => {
  const { customers } = req.body;
  if (!Array.isArray(customers) || customers.length === 0) {
    throw new AppError("No customer updates provided.", 400);
  }

  const updates = customers.map(async (item) => {
    const customerId = item._id || item.id;
    if (!customerId) return null;

    const update = {
      name: String(item.name || "").trim(),
      email: String(item.email || "")
        .trim()
        .toLowerCase(),
      product: String(item.product || "").trim(),
      quantity: Number(item.quantity),
      price: Number(item.price),
    };

    if (
      !update.name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.email) ||
      !update.product ||
      !Number.isFinite(update.quantity) ||
      update.quantity <= 0 ||
      !Number.isFinite(update.price) ||
      update.price < 0
    ) {
      throw new AppError("Invalid customer data in edit table.", 400);
    }

    await Customer.updateOne({ _id: customerId, userId: req.user._id }, { $set: update });
    return customerId;
  });

  const ids = (await Promise.all(updates)).filter(Boolean);
  const updatedCustomers = await Customer.find({
    _id: { $in: ids },
    userId: req.user._id,
  }).sort({ createdAt: -1 });

  res.json({
    message: "Customer data updated successfully.",
    customers: updatedCustomers,
  });
});

const saveAdvancedSettings = asyncHandler(async (req, res) => {
  const fields = ["country", "bankName", "accountNumber", "ifsc", "paymentEmail"];
  const update = {};
  fields.forEach((field) => {
    if (field in req.body) update[field] = String(req.body[field] || "").trim();
  });

  const profile = await Profile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: update, $setOnInsert: { userId: req.user._id } },
    { upsert: true, new: true }
  );

  res.json({
    message: "Advanced settings saved.",
    profile,
  });
});

const sendInvoices = asyncHandler(async (req, res) => {
  const { customerIds, batchId } = req.body;

  const customers = await getPendingCustomers({
    userId: req.user._id,
    customerIds,
    batchId,
  });

  if (!customers.length) {
    throw new AppError("No pending customer records found to send.", 404);
  }

  const results = await sendInvoicesForCustomers({
    userId: req.user._id,
    customers,
  });

  const sentCount = results.filter((item) => item.status === "sent").length;
  const failed = results.filter((item) => item.status === "failed");

  res.json({
    message: `Invoice sending completed. Sent: ${sentCount}, Failed: ${failed.length}.`,
    sentCount,
    failedCount: failed.length,
    results,
    failed,
  });
});

module.exports = {
  parseAndStoreSalesData,
  updateCustomers,
  saveAdvancedSettings,
  sendInvoices,
};
