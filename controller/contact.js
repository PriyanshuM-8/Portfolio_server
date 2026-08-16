import nodemailer from "nodemailer";

export const verifyEmailService = async () => {
  const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_PASS;
  if (!apiKey) {
    console.log("❌ [EMAIL SERVICE] Missing BREVO_API_KEY / BREVO_SMTP_PASS in environment variables.");
    return;
  }

  // 1. Verify Brevo REST API Key
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey, "accept": "application/json" }
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ [EMAIL SERVICE] Brevo API Connected & Ready! (Account: ${data.email || 'Active'})`);
      return;
    } else {
      console.log(`⚠️ [EMAIL SERVICE] Brevo API Check: ${data.message || data.code}`);
    }
  } catch (err) {
    console.log(`⚠️ [EMAIL SERVICE] Brevo API Network Check Failed: ${err.message}`);
  }

  // 2. Verify Nodemailer SMTP Transporter
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
      port: Number(process.env.BREVO_SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER || "b437b1001@smtp-brevo.com",
        pass: apiKey,
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
    });

    await transporter.verify();
    console.log("✅ [EMAIL SERVICE] Nodemailer SMTP Transporter Connected & Ready!");
  } catch (err) {
    console.log(`❌ [EMAIL SERVICE] Email Transporter Connection Error: ${err.message}`);
  }
};

export const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      error: "All fields are required.",
    });
  }

  const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_PASS;
  const emailFrom = (process.env.EMAIL_FROM || "priyanshumaddeshiya72@gmail.com").replace(/<|>/g, "").trim();
  const emailTo = (process.env.EMAIL_TO || "maddeshiyapriyanshu2@gmail.com").replace(/<|>/g, "").trim();

  if (!apiKey) {
    console.error("Email error: BREVO_API_KEY / BREVO_SMTP_PASS is not set.");
    return res.status(500).json({
      error: "Server email credentials missing.",
      detail: "BREVO_API_KEY or BREVO_SMTP_PASS is missing in Render environment variables.",
    });
  }

  // HTML template
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <div style="background:#c98826;padding:20px 24px">
        <h2 style="color:#000;margin:0;font-size:18px">New Portfolio Message</h2>
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 12px"><b>Name:</b> ${name}</p>
        <p style="margin:0 0 12px"><b>Email:</b> <a href="mailto:${email}">${email}</a></p>
        <p style="margin:0 0 8px"><b>Message:</b></p>
        <p style="background:#f8fafc;padding:12px;border-radius:6px;margin:0;white-space:pre-wrap">${message}</p>
      </div>
      <div style="background:#f1f5f9;padding:12px 24px;font-size:12px;color:#64748b">
        Sent from your portfolio contact form
      </div>
    </div>
  `;

  // Method 1: Try Brevo REST API v3 (bypasses SMTP IP restrictions & port blocks on Render)
  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: "Portfolio Contact", email: emailFrom },
        to: [{ email: emailTo }],
        replyTo: { email: email, name: name },
        subject: `New Message from ${name}`,
        htmlContent,
      }),
    });

    const brevoData = await brevoRes.json();

    if (brevoRes.ok) {
      console.log("Email sent successfully via Brevo API:", brevoData);
      return res.status(200).json({ message: "Email sent successfully." });
    }

    console.warn("Brevo API warning response:", brevoData);
    throw new Error(brevoData.message || brevoData.code || "Brevo API call failed");
  } catch (apiError) {
    console.error("Brevo API failed, trying Nodemailer SMTP fallback:", apiError.message);

    // Method 2: Fallback to Nodemailer SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
        port: Number(process.env.BREVO_SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_USER || "b437b1001@smtp-brevo.com",
          pass: apiKey,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 15000,
      });

      await transporter.sendMail({
        from: `"Portfolio Contact" <${emailFrom}>`,
        to: emailTo,
        replyTo: email,
        subject: `New Message from ${name}`,
        html: htmlContent,
      });

      return res.status(200).json({ message: "Email sent successfully." });
    } catch (smtpError) {
      console.error("SMTP error code:", smtpError.code);
      console.error("SMTP error message:", smtpError.message);

      return res.status(500).json({
        error: "Failed to send email.",
        detail: apiError.message || smtpError.message || "Internal server error during email dispatch.",
        code: smtpError.code || "EAUTH",
      });
    }
  }
};