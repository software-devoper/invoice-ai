const verificationEmailTemplate = ({ username, verificationLink }) => `
  <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #0891b2; margin-bottom: 8px;">Welcome to Invoice SaaS</h2>
    <p>Hello ${username},</p>
    <p>Please verify your email address to activate your account.</p>
    <p style="margin: 24px 0;">
      <a href="${verificationLink}" style="background: #0891b2; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block;">
        Verify Email
      </a>
    </p>
    <p>If the button doesn't work, use this link:</p>
    <p><a href="${verificationLink}">${verificationLink}</a></p>
    <p style="margin-top: 24px; color: #334155;">Invoice SaaS Team</p>
  </div>
`;

const invoiceEmailTemplate = ({ customerName, companyName, invoiceNumber }) => `
  <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #0891b2; margin-bottom: 8px;">Your Invoice Is Ready</h2>
    <p>Hello ${customerName},</p>
    <p>Please find your invoice <strong>${invoiceNumber}</strong> attached.</p>
    <p>Issued by: ${companyName}</p>
    <p style="margin-top: 24px;">Thank you.</p>
  </div>
`;

module.exports = {
  verificationEmailTemplate,
  invoiceEmailTemplate,
};

