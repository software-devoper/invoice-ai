const dns = require("dns");
const nodemailer = require("nodemailer");

let transporter;

const forceIpv4Lookup = (hostname, options, callback) => {
  const normalizedOptions = typeof options === "object" && options !== null ? options : {};
  const normalizedCallback = typeof options === "function" ? options : callback;
  return dns.lookup(hostname, { ...normalizedOptions, family: 4, all: false }, normalizedCallback);
};

const isTrue = (value) => String(value || "").trim().toLowerCase() === "true";

const getMailerTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transportConfig = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 20000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 20000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 60000),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (isTrue(process.env.SMTP_FORCE_IPV4)) {
      transportConfig.lookup = forceIpv4Lookup;
      transportConfig.tls = {
        ...(transportConfig.tls || {}),
        servername: process.env.SMTP_HOST,
      };
    }

    transporter = nodemailer.createTransport(transportConfig);
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    // eslint-disable-next-line no-console
    console.warn("SMTP config missing: using JSON transport (dev-only).");
  }

  return transporter;
};

module.exports = { getMailerTransporter };
