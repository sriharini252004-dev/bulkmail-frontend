

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GMAIL_USER = ("sriharini252004@gmail.com").trim();
// App password spaces irundha remove pannidum
const GMAIL_APP_PASSWORD = ("wuay orgt jymg iajs").replace(/\s+/g, "");
const PORT = process.env.PORT || 5000;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sriharini252004@gmail.com",
    pass:"wuay orgt jymg iajs",
  },
});

// Backend test
app.get("/", (req, res) => {
  res.send("BulkMail backend is running!");
});

// Send email
app.post("/sendemail", async (req, res) => {
  try {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: "Server .env la GMAIL_USER / GMAIL_APP_PASSWORD illa.",
      });
    }

    const { msg, emailList } = req.body;

    if (typeof msg !== "string" || !msg.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message empty ah irukku.",
      });
    }

    if (!Array.isArray(emailList) || emailList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Receiver email illa. Email type pannunga illa file upload pannunga.",
      });
    }

    // Clean + duplicate remove + valid emails mattum
    const recipients = [
      ...new Set(
        emailList
          .map((email) => String(email).trim().toLowerCase())
          .filter((email) => EMAIL_REGEX.test(email))
      ),
    ];

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid email address ethuvum kidaikala.",
      });
    }

    let sent = 0;
    const failed = [];

    // Ovvoru recipient ku thani email
    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: `"BulkMail" <${"sriharini252004@gmail.com"}>`,
          to: recipient,
          subject: "Message from BulkMail",
          text: msg,
        });
        sent++;
        console.log("Sent to:", recipient);
      } catch (error) {
        console.error("Failed:", recipient, error.message);
        failed.push({ email: recipient, error: error.message });
      }
    }

    let message = "Email sent successfully!";
    if (sent === 0) {
      message = `Email anuppa mudiyala: ${failed[0]?.error || "Unknown error"}`;
    } else if (failed.length > 0) {
      message = `${sent} sent, ${failed.length} failed.`;
    }

    res.status(200).json({
      success: sent > 0 && failed.length === 0,
      sent,
      total: recipients.length,
      failedCount: failed.length,
      message,
    });
  } catch (error) {
    console.error("Email error:", error.message);
    res.status(500).json({
      success: false,
      message: "Email sending failed. Please try again.",
    });
  }
});

// Server first start aagum (crash aagaadhu)
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log("WARNING: .env la GMAIL_USER / GMAIL_APP_PASSWORD illa. Fill panni restart pannunga.");
    return;
  }

  // Gmail login check (background la)
  transporter
    .verify()
    .then(() => console.log("Gmail connection successful!"))
    .catch((err) =>
      console.log("Gmail login failed:", err.message, "\n=> App Password check pannunga.")
    );
});


