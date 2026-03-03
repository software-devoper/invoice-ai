const fs = require("fs");
const { getMailerTransporter } = require("../config/mailer");
const { invoiceEmailTemplate, verificationEmailTemplate } = require("../utils/emailTemplate");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getResendApiKey = () => String(process.env.RESEND_API_KEY || "").trim();
const normalizeProvider = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "resend" || normalized === "smtp") return normalized;
  return "";
};
const normalizeFrom = (value, fallback = "") => {
  const normalized = String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  return normalized || fallback;
};
const normalizeBaseUrl = (value, fallback = "") =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "") || fallback;
const buildVerificationLink = (token) => {
  const encodedToken = encodeURIComponent(token);
  const appBaseUrl = normalizeBaseUrl(process.env.APP_URL);
  if (appBaseUrl) {
    return `${appBaseUrl}/api/auth/verify-email?token=${encodedToken}`;
  }

  const clientBaseUrl = normalizeBaseUrl(process.env.CLIENT_URL, "http://localhost:5173");
  return `${clientBaseUrl}/verify-email?token=${encodedToken}`;
};
const isValidFromField = (value) => {
  const plainEmailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const namedEmailPattern = /^.+<\s*[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+\s*>$/;
  return plainEmailPattern.test(value) || namedEmailPattern.test(value);
};
const getSafeFrom = (value) => {
  const fallback = "onboarding@resend.dev";
  const normalized = normalizeFrom(value, fallback);
  if (isValidFromField(normalized)) return normalized;
  // eslint-disable-next-line no-console
  console.warn(`Invalid from field "${normalized}", falling back to ${fallback}`);
  return fallback;
};

const getConfiguredProvider = () => {
  const explicitProvider = normalizeProvider(process.env.EMAIL_PROVIDER);

  if (explicitProvider === "resend") return "resend";
  if (explicitProvider === "smtp") return "smtp";

  if (String(process.env.NODE_ENV || "").toLowerCase() === "production") {
    return "resend";
  }

  return getResendApiKey().length > 0 ? "resend" : "smtp";
};

const getProviderForEmailType = (emailType) => {
  const scopedKeyMap = {
    verification: "EMAIL_PROVIDER_VERIFICATION",
    invoice: "EMAIL_PROVIDER_INVOICE",
  };
  const scopedProvider = normalizeProvider(process.env[scopedKeyMap[emailType]]);
  if (scopedProvider) return scopedProvider;
  return getConfiguredProvider();
};

const assertProviderConfig = (provider) => {
  if (provider === "resend" && getResendApiKey().length === 0) {
    throw new Error("EMAIL_PROVIDER is 'resend' but RESEND_API_KEY is missing.");
  }
  if (
    provider === "smtp" &&
    (!String(process.env.SMTP_HOST || "").trim() ||
      !String(process.env.SMTP_USER || "").trim() ||
      !String(process.env.SMTP_PASS || "").trim())
  ) {
    throw new Error("SMTP provider selected but SMTP_HOST/SMTP_USER/SMTP_PASS is missing.");
  }
};

const toArray = (value) => (Array.isArray(value) ? value : [value].filter(Boolean));

const buildResendAttachments = (attachments = []) =>
  attachments
    .map((attachment) => {
      if (!attachment) return null;

      if (attachment.content && attachment.filename) {
        return {
          filename: attachment.filename,
          content: attachment.content,
        };
      }

      if (attachment.path && attachment.filename) {
        if (/^https?:\/\//i.test(attachment.path)) {
          return {
            filename: attachment.filename,
            path: attachment.path,
          };
        }

        if (fs.existsSync(attachment.path)) {
          return {
            filename: attachment.filename,
            content: fs.readFileSync(attachment.path).toString("base64"),
          };
        }
      }

      return null;
    })
    .filter(Boolean);

const sendWithResend = async (mailOptions) => {
  const payload = {
    from: getSafeFrom(mailOptions.from || process.env.RESEND_FROM || process.env.SMTP_FROM),
    to: toArray(mailOptions.to),
    subject: mailOptions.subject,
    html: mailOptions.html,
    text: mailOptions.text,
    reply_to: mailOptions.replyTo,
  };

  const attachments = buildResendAttachments(mailOptions.attachments);
  if (attachments.length > 0) {
    payload.attachments = attachments;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error ${response.status}: ${errorBody}`);
  }

  return response.json();
};

const sendMailWithRetry = async (mailOptions, retries = 3, options = {}) => {
  const provider = normalizeProvider(options.provider) || getConfiguredProvider();
  const emailType = String(options.emailType || "general");
  assertProviderConfig(provider);
  // eslint-disable-next-line no-console
  console.info(`Email provider selected for ${emailType}: ${provider}`);

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      let info;
      if (provider === "resend") {
        info = await sendWithResend(mailOptions);
      } else {
        const transporter = await getMailerTransporter();
        info = await transporter.sendMail(mailOptions);
      }
      return info;
    } catch (error) {
      lastError = error;
      // eslint-disable-next-line no-console
      console.warn(`Email send attempt ${attempt}/${retries} failed via ${provider}: ${error.message}`);
      if (attempt < retries) {
        await sleep(500 * attempt);
      }
    }
  }
  throw new Error(`[${provider}] ${lastError?.message || "Unknown email error"}`);
};

const sendVerificationEmail = async ({ to, username, token }) => {
  const verificationLink = buildVerificationLink(token);
  const provider = getProviderForEmailType("verification");
  return sendMailWithRetry({
    from: getSafeFrom(process.env.RESEND_FROM || process.env.SMTP_FROM),
    to,
    subject: "Verify your Invoice SaaS account",
    html: verificationEmailTemplate({ username, verificationLink }),
  }, 3, { provider, emailType: "verification" });
};

const sendInvoiceEmail = async ({ to, customerName, companyName, invoiceNumber, pdfFilePath }) => {
  const provider = getProviderForEmailType("invoice");
  return sendMailWithRetry(
    {
      from: getSafeFrom(process.env.RESEND_FROM || process.env.SMTP_FROM),
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
    3,
    { provider, emailType: "invoice" }
  );
};

module.exports = {
  sendMailWithRetry,
  sendVerificationEmail,
  sendInvoiceEmail,
};
