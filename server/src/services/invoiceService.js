const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");
const Profile = require("../models/Profile");
const AppError = require("../utils/AppError");
const { buildInvoiceNumber } = require("../utils/invoiceNumber");
const { generateInvoicePdf } = require("../utils/invoicePdf");
const { sendInvoiceEmail } = require("./emailService");

const sendInvoicesForCustomers = async ({ userId, customers }) => {
  const profile = await Profile.findOne({ userId });
  if (!profile || !profile.companyName || !profile.address || !profile.email) {
    throw new AppError("Please configure Company Name, Company Address, and Company Email in Profile.", 400);
  }

  const taxRate = Number(process.env.TAX_RATE || 0);
  const results = [];

  for (const customer of customers) {
    let invoice = null;
    let pdf = null;

    try {
      const invoiceNumber = buildInvoiceNumber();
      pdf = await generateInvoicePdf({
        invoiceNumber,
        customer,
        profile,
        taxRate,
        userId,
      });

      invoice = await Invoice.create({
        userId,
        customerId: customer._id,
        invoiceNumber,
        pdfUrl: pdf.fileUrl,
        status: "unsent",
      });

      await sendInvoiceEmail({
        to: customer.email,
        customerName: customer.name,
        companyName: profile.companyName,
        invoiceNumber,
        pdfFilePath: pdf.filePath,
      });

      invoice.status = "sent";
      await invoice.save();

      await Customer.updateOne(
        { _id: customer._id, userId },
        {
          $set: {
            sent: true,
            sentDate: new Date(),
          },
        }
      );

      results.push({
        customerId: String(customer._id),
        status: "sent",
        invoiceNumber,
      });
    } catch (error) {
      if (invoice) {
        invoice.status = "unsent";
        await invoice.save();
      }

      // eslint-disable-next-line no-console
      console.error(`Invoice send failed for ${customer.email}: ${error.message}`);

      results.push({
        customerId: String(customer._id),
        status: "failed",
        error: error.message,
      });
    }
  }

  return results;
};

const getPendingCustomers = async ({ userId, customerIds, batchId }) => {
  const query = { userId, sent: false };
  if (Array.isArray(customerIds) && customerIds.length > 0) {
    query._id = { $in: customerIds };
  } else if (batchId) {
    query.batchId = batchId;
  }

  return Customer.find(query).sort({ createdAt: -1 });
};

module.exports = {
  sendInvoicesForCustomers,
  getPendingCustomers,
};
