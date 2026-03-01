const express = require("express");
const {
  getInvoiceRecords,
  deleteInvoiceRecord,
  exportInvoiceRecord,
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/records", protect, getInvoiceRecords);
router.delete("/records/:customerId", protect, deleteInvoiceRecord);
router.get("/records/:customerId/export", protect, exportInvoiceRecord);

module.exports = router;

