const nodemailer = require("nodemailer");

let transporter;

const getMailerTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    // eslint-disable-next-line no-console
    console.warn("SMTP config missing: using JSON transport (dev-only).");
  }

  return transporter;
};

module.exports = { getMailerTransporter };

