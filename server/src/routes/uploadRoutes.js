const express = require("express");
const {
  parseAndStoreSalesData,
  updateCustomers,
  saveAdvancedSettings,
  sendInvoices,
} = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");
const { uploadSalesFile } = require("../middleware/upload");

const router = express.Router();

router.post("/parse", protect, uploadSalesFile.single("file"), parseAndStoreSalesData);
router.put("/customers", protect, updateCustomers);
router.put("/advanced-settings", protect, saveAdvancedSettings);
router.post("/send", protect, sendInvoices);

module.exports = router;

