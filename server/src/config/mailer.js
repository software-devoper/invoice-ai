const dns = require("dns");
const nodemailer = require("nodemailer");

let transporter;

const SMTP_PROVIDER_DEFAULTS = {
  brevo: { host: "smtp-relay.brevo.com", port: 587, secure: false },
  sendgrid: { host: "smtp.sendgrid.net", port: 587, secure: false },
  mailgun: { host: "smtp.mailgun.org", port: 587, secure: false },
  gmail: { host: "smtp.gmail.com", port: 587, secure: false },
};

const forceIpv4Lookup = (hostname, options, callback) => {
  const normalizedOptions = typeof options === "object" && options !== null ? options : {};
  const normalizedCallback = typeof options === "function" ? options : callback;
  return dns.lookup(hostname, { ...normalizedOptions, family: 4, all: false }, normalizedCallback);
};

const isTrue = (value) => String(value || "").trim().toLowerCase() === "true";
const getSmtpProviderDefaults = () => {
  const key = String(process.env.SMTP_PROVIDER || "")
    .trim()
    .toLowerCase();
  return SMTP_PROVIDER_DEFAULTS[key] || {};
};

const getMailerTransporter = async () => {
  if (transporter) return transporter;

  const smtpDefaults = getSmtpProviderDefaults();
  const smtpHost = String(process.env.SMTP_HOST || smtpDefaults.host || "").trim();
  const smtpPort = Number(process.env.SMTP_PORT || smtpDefaults.port || 587);
  const smtpSecure = String(process.env.SMTP_SECURE || smtpDefaults.secure || "false") === "true";
  const smtpUser = String(process.env.SMTP_USER || "").trim();
  const smtpPass = String(process.env.SMTP_PASS || "").trim();

  if (smtpHost && smtpUser && smtpPass) {
    if (isTrue(process.env.SMTP_FORCE_IPV4)) {
      try {
        // Ensure Node prefers IPv4 for DNS results (helps on platforms without IPv6 routing).
        dns.setDefaultResultOrder("ipv4first");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to set DNS result order: ${error?.message || error}`);
      }
    }

    const transportConfig = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 20000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 20000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 60000),
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    };

    if (isTrue(process.env.SMTP_FORCE_IPV4)) {
      transportConfig.lookup = forceIpv4Lookup;
      transportConfig.tls = {
        ...(transportConfig.tls || {}),
        servername: smtpHost,
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
