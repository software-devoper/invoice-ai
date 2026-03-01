const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const getInvoiceRecords = asyncHandler(async (req, res) => {
  const customers = await Customer.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const customerIds = customers.map((c) => c._id);
  const invoices = await Invoice.find({
    userId: req.user._id,
    customerId: { $in: customerIds },
  }).sort({ createdAt: -1 });

  const invoiceByCustomer = new Map();
  invoices.forEach((invoice) => {
    if (!invoiceByCustomer.has(String(invoice.customerId))) {
      invoiceByCustomer.set(String(invoice.customerId), invoice);
    }
  });

  const records = customers.map((customer) => {
    const invoice = invoiceByCustomer.get(String(customer._id));
    const isSent = customer.sent || invoice?.status === "sent";
    return {
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      product: customer.product,
      quantity: customer.quantity,
      price: customer.price,
      status: isSent ? "sent" : "unsent",
      date: customer.sentDate || invoice?.updatedAt || customer.createdAt,
      invoiceId: invoice?._id || null,
      invoiceNumber: invoice?.invoiceNumber || null,
      pdfUrl: invoice?.pdfUrl || null,
    };
  });

  res.json({ records });
});

const deleteInvoiceRecord = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const customer = await Customer.findOne({ _id: customerId, userId: req.user._id });
  if (!customer) throw new AppError("Record not found.", 404);

  const invoices = await Invoice.find({ userId: req.user._id, customerId });
  for (const invoice of invoices) {
    if (invoice.pdfUrl) {
      const absolutePath = path.join(__dirname, "..", "..", invoice.pdfUrl.replace(/^\/+/, ""));
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }
  }

  await Promise.all([Invoice.deleteMany({ userId: req.user._id, customerId }), customer.deleteOne()]);
  res.json({ message: "Record deleted successfully." });
});

const exportInvoiceRecord = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const format = String(req.query.format || "csv").toLowerCase();

  const customer = await Customer.findOne({ _id: customerId, userId: req.user._id });
  if (!customer) throw new AppError("Record not found.", 404);

  const row = {
    customerId: String(customer._id),
    customerName: customer.name,
    customerEmail: customer.email,
    product: customer.product,
    quantity: customer.quantity,
    price: customer.price,
    status: customer.sent ? "Sent" : "Unsent",
    date: (customer.sentDate || customer.createdAt).toISOString(),
  };

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Invoice Record");
    sheet.columns = [
      { header: "Customer ID", key: "customerId", width: 26 },
      { header: "Customer Name", key: "customerName", width: 20 },
      { header: "Customer Email", key: "customerEmail", width: 28 },
      { header: "Product", key: "product", width: 22 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Price", key: "price", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Date", key: "date", width: 24 },
    ];
    sheet.addRow(row);
    sheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-record-${customer._id}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    await workbook.xlsx.write(res);
    res.end();
    return;
  }

  if (format === "csv") {
    const headers = Object.keys(row);
    const values = Object.values(row).map((value) => `"${String(value).replace(/"/g, "\"\"")}"`);
    const csv = `${headers.join(",")}\n${values.join(",")}\n`;

    res.setHeader("Content-Disposition", `attachment; filename="invoice-record-${customer._id}.csv"`);
    res.setHeader("Content-Type", "text/csv");
    res.send(csv);
    return;
  }

  throw new AppError("Unsupported export format. Use csv or xlsx.", 400);
});

module.exports = {
  getInvoiceRecords,
  deleteInvoiceRecord,
  exportInvoiceRecord,
};
