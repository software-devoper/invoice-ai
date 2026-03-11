const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    const emailProvider = String(
      process.env.EMAIL_PROVIDER ||
        (process.env.BREVO_API_KEY ? "brevo" : process.env.RESEND_API_KEY ? "resend" : "smtp")
    );
    const resendKeyPresent = Boolean(String(process.env.RESEND_API_KEY || "").trim());
    const brevoKeyPresent = Boolean(String(process.env.BREVO_API_KEY || "").trim());
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Email provider mode: ${emailProvider}`);
    // eslint-disable-next-line no-console
    console.log(`Resend key present: ${resendKeyPresent}`);
    // eslint-disable-next-line no-console
    console.log(`Brevo key present: ${brevoKeyPresent}`);
  });
};

startServer();
