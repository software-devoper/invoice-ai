const { getMailerTransporter } = require("../config/mailer");
const { invoiceEmailTemplate, verificationEmailTemplate } = require("../utils/emailTemplate");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendMailWithRetry = async (mailOptions, retries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const transporter = await getMailerTransporter();
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(500 * attempt);
      }
    }
  }
  throw lastError;
};

const sendVerificationEmail = async ({ to, username, token }) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  return sendMailWithRetry({
    from: process.env.SMTP_FROM,
    to,
    subject: "Verify your Invoice SaaS account",
    html: verificationEmailTemplate({ username, verificationLink }),
  });
};

const sendInvoiceEmail = async ({ to, customerName, companyName, invoiceNumber, pdfFilePath }) =>
  sendMailWithRetry(
    {
      from: process.env.SMTP_FROM,
      to,
      subject: `Invoice ${invoiceNumber}`,
      html: invoiceEmailTemplate({ customerName, companyName, invoiceNumber }),
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          path: pdfFilePath,
        },
      ],
    },
    3
  );

module.exports = {
  sendMailWithRetry,
  sendVerificationEmail,
  sendInvoiceEmail,
};

