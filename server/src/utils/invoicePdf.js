const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const currency = (value) => `$${Number(value || 0).toFixed(2)}`;
const compact = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();
const truncate = (value, max = 40) => {
  const text = compact(value);
  if (text.length <= max) return text || "-";
  return `${text.slice(0, max - 1)}...`;
};

const generateInvoicePdf = async ({ invoiceNumber, customer, profile, taxRate, userId }) =>
  new Promise((resolve, reject) => {
    try {
      const invoicesDir = path.join(__dirname, "..", "..", "uploads", "invoices", String(userId));
      ensureDirectory(invoicesDir);

      const fileName = `${invoiceNumber}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      const fileUrl = `/uploads/invoices/${userId}/${fileName}`;

      const doc = new PDFDocument({
        margin: 40,
        size: "A4",
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const startX = doc.page.margins.left;
      const startY = doc.page.margins.top;

      // Accent band
      doc.rect(0, 0, doc.page.width, 90).fill("#e6faff");

      // Header
      doc.fillColor("#0e7490").fontSize(30).font("Helvetica-Bold").text("INVOICE", startX, startY + 10, {
        align: "right",
      });

      const normalizedLogoPath = profile.logoUrl ? profile.logoUrl.replace(/^\/+/, "") : "";
      const hasLogo =
        normalizedLogoPath && fs.existsSync(path.join(__dirname, "..", "..", normalizedLogoPath));
      let drewLogo = false;
      if (hasLogo) {
        const logoPath = path.join(__dirname, "..", "..", normalizedLogoPath);
        try {
          doc.image(logoPath, startX, startY + 10, { fit: [120, 55] });
          drewLogo = true;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(`Logo render failed for ${logoPath}: ${error.message}`);
        }
      }
      if (!drewLogo) {
        doc
          .fillColor("#0891b2")
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(profile.companyName || "Your Company", startX, startY + 25);
      }

      doc.fillColor("#0f172a");
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Invoice No: ${truncate(invoiceNumber, 28)}`, startX, 110, { lineBreak: false })
        .text(`Date: ${new Date().toLocaleDateString()}`, startX, 126);

      // Billed by / billed to cards
      doc.roundedRect(startX, 155, pageWidth / 2 - 8, 110, 10).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.roundedRect(startX + pageWidth / 2 + 8, 155, pageWidth / 2 - 8, 110, 10).fillAndStroke("#f8fafc", "#cbd5e1");

      doc.fillColor("#0891b2").fontSize(11).font("Helvetica-Bold").text("Billed By", startX + 14, 168);
      doc
        .fillColor("#0f172a")
        .fontSize(10)
        .font("Helvetica")
        .text(truncate(profile.companyName, 40), startX + 14, 186, { width: pageWidth / 2 - 36, lineBreak: false })
        .text(truncate(profile.address, 58), startX + 14, 201, { width: pageWidth / 2 - 36, lineBreak: false })
        .text(truncate(profile.email, 42), startX + 14, 216, { width: pageWidth / 2 - 36, lineBreak: false });

      doc
        .fillColor("#0891b2")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Billed To", startX + pageWidth / 2 + 22, 168);
      doc
        .fillColor("#0f172a")
        .fontSize(10)
        .font("Helvetica")
        .text(truncate(customer.name, 38), startX + pageWidth / 2 + 22, 186, {
          width: pageWidth / 2 - 36,
          lineBreak: false,
        })
        .text(truncate(customer.email, 42), startX + pageWidth / 2 + 22, 201, {
          width: pageWidth / 2 - 36,
          lineBreak: false,
        })
        .text(`Customer ID: ${truncate(customer._id, 20)}`, startX + pageWidth / 2 + 22, 216, {
          width: pageWidth / 2 - 36,
          lineBreak: false,
        });

      // Table header
      const tableTop = 290;
      doc.rect(startX, tableTop, pageWidth, 28).fill("#0891b2");
      doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold");
      doc.text("Item", startX + 12, tableTop + 9);
      doc.text("Qty", startX + pageWidth - 210, tableTop + 9, { width: 40, align: "right" });
      doc.text("Price", startX + pageWidth - 145, tableTop + 9, { width: 60, align: "right" });
      doc.text("Line Total", startX + pageWidth - 75, tableTop + 9, { width: 65, align: "right" });

      const rowY = tableTop + 28;
      doc.rect(startX, rowY, pageWidth, 36).fillAndStroke("#f8fafc", "#e2e8f0");

      const subtotal = Number(customer.quantity) * Number(customer.price);
      const taxAmount = subtotal * Number(taxRate || 0);
      const total = subtotal + taxAmount;

      doc.fillColor("#0f172a").font("Helvetica").fontSize(10);
      doc.text(truncate(customer.product, 48), startX + 12, rowY + 12, {
        width: pageWidth - 240,
        lineBreak: false,
      });
      doc.text(String(customer.quantity), startX + pageWidth - 210, rowY + 12, {
        width: 40,
        align: "right",
        lineBreak: false,
      });
      doc.text(currency(customer.price), startX + pageWidth - 145, rowY + 12, {
        width: 60,
        align: "right",
        lineBreak: false,
      });
      doc.text(currency(subtotal), startX + pageWidth - 75, rowY + 12, {
        width: 65,
        align: "right",
        lineBreak: false,
      });

      // Totals
      const totalsTop = rowY + 58;
      doc.fontSize(10).font("Helvetica");
      doc.text("Subtotal", startX + pageWidth - 180, totalsTop, { width: 90 });
      doc.text(currency(subtotal), startX + pageWidth - 80, totalsTop, { width: 70, align: "right" });

      doc.text(`Tax (${Math.round(Number(taxRate || 0) * 100)}%)`, startX + pageWidth - 180, totalsTop + 18, { width: 90 });
      doc.text(currency(taxAmount), startX + pageWidth - 80, totalsTop + 18, { width: 70, align: "right" });

      doc.font("Helvetica-Bold");
      doc.text("Total", startX + pageWidth - 180, totalsTop + 42, { width: 90 });
      doc.text(currency(total), startX + pageWidth - 80, totalsTop + 42, { width: 70, align: "right" });

      // Payment info block
      const paymentTop = totalsTop + 84;
      doc.roundedRect(startX, paymentTop, pageWidth, 96, 10).fillAndStroke("#ecfeff", "#a5f3fc");
      doc.fillColor("#0e7490").font("Helvetica-Bold").fontSize(11).text("Payment Information", startX + 12, paymentTop + 12);
      doc.fillColor("#0f172a").font("Helvetica").fontSize(10);
      doc.text(`Country: ${truncate(profile.country, 24)}`, startX + 12, paymentTop + 34, { lineBreak: false });
      doc.text(`Bank Name: ${truncate(profile.bankName, 24)}`, startX + 12, paymentTop + 50, { lineBreak: false });
      doc.text(`Account Number: ${truncate(profile.accountNumber, 24)}`, startX + 280, paymentTop + 34, {
        lineBreak: false,
      });
      doc.text(`IFSC Code: ${truncate(profile.ifsc, 20)}`, startX + 280, paymentTop + 50, { lineBreak: false });
      doc.text(`Payment Email: ${truncate(profile.paymentEmail || profile.email, 42)}`, startX + 12, paymentTop + 66, {
        width: pageWidth - 24,
        lineBreak: false,
      });

      const footerY = doc.page.height - doc.page.margins.bottom - 20;
      doc
        .fillColor("#64748b")
        .fontSize(9)
        .text("Thank you for your business.", startX, footerY, {
          width: pageWidth,
          align: "center",
          lineBreak: false,
        });

      doc.end();

      stream.on("finish", () => resolve({ filePath, fileUrl }));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });

module.exports = { generateInvoicePdf };
