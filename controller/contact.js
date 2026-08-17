import nodemailer from "nodemailer";

// Helper function to escape HTML special characters and prevent email HTML injection
const escapeHtml = (str = "") => {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const verifyEmailService = async () => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const brevoPort = Number(process.env.BREVO_SMTP_PORT) || 587;
  const brevoUser = process.env.BREVO_SMTP_USER;
  const brevoPass = process.env.BREVO_SMTP_PASS;

  if (brevoApiKey) {
    console.log("✅ [EMAIL SERVICE] Brevo REST API Key detected & ready!");
  }

  if (brevoUser && brevoPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: brevoHost,
        port: brevoPort,
        secure: false,
        auth: { user: brevoUser, pass: brevoPass },
        family: 4,
        tls: { rejectUnauthorized: false },
      });
      await transporter.verify();
      console.log(`✅ [EMAIL SERVICE] Brevo SMTP Connected & Ready! (${brevoUser})`);
      return;
    } catch (err) {
      console.log(`⚠️ [EMAIL SERVICE] Brevo SMTP Check Warning: ${err.message}`);
    }
  }

  // Fallback check: Gmail Transporter
  const gmailUser = process.env.EMAIL_USER;
  const gmailPass = process.env.EMAIL_PASS;
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass },
        family: 4,
      });
      await transporter.verify();
      console.log(`✅ [EMAIL SERVICE] Gmail Transporter Connected & Ready! (${gmailUser})`);
    } catch (err) {
      console.log(`⚠️ [EMAIL SERVICE] Gmail Transporter Check Warning: ${err.message}`);
    }
  }

  if (!brevoApiKey && (!brevoUser || !brevoPass) && (!gmailUser || !gmailPass)) {
    console.log("⚠️ [EMAIL SERVICE] Warning: Missing email service credentials in environment variables!");
  }
};

export const sendContactEmail = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim();
  const message = req.body.message?.trim();

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const brevoPort = Number(process.env.BREVO_SMTP_PORT) || 587;
  const brevoUser = process.env.BREVO_SMTP_USER;
  const brevoPass = process.env.BREVO_SMTP_PASS;
  const emailFrom = (process.env.EMAIL_FROM || "priyanshumaddeshiya72@gmail.com").replace(/<|>/g, "").trim();
  const emailTo = (process.env.EMAIL_TO || "maddeshiyapriyanshu2@gmail.com").replace(/<|>/g, "").trim();

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <div style="background:#c98826;padding:20px 24px">
        <h2 style="color:#000;margin:0;font-size:18px">New Portfolio Message</h2>
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 12px"><b>Name:</b> ${safeName}</p>
        <p style="margin:0 0 12px"><b>Email:</b> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin:0 0 8px"><b>Message:</b></p>
        <p style="background:#f8fafc;padding:12px;border-radius:6px;margin:0;white-space:pre-wrap">${safeMessage}</p>
      </div>
      <div style="background:#f1f5f9;padding:12px 24px;font-size:12px;color:#64748b">
        Sent from your portfolio contact form
      </div>
    </div>
  `;

  // 1. Primary: Try Brevo REST API v3 (Most reliable on cloud environments like Render)
  const restApiKey = brevoApiKey || (brevoPass && brevoPass.startsWith("xkeysib-") ? brevoPass : null);
  if (restApiKey) {
    try {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": restApiKey,
        },
        body: JSON.stringify({
          sender: { name: "Portfolio Contact", email: emailFrom },
          to: [{ email: emailTo }],
          replyTo: { email: email, name: name },
          subject: `New Message from ${safeName}`,
          htmlContent,
        }),
      });

      const brevoData = await brevoRes.json();
      if (brevoRes.ok) {
        console.log("Email sent successfully via Brevo REST API!");
        return res.status(200).json({ message: "Email sent successfully." });
      }
      console.warn("Brevo REST API warning:", brevoData);
    } catch (apiErr) {
      console.warn("Brevo REST API failed:", apiErr.message);
    }
  }

  // 2. Secondary: Try Brevo SMTP
  if (brevoUser && brevoPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: brevoHost,
        port: brevoPort,
        secure: false,
        auth: { user: brevoUser, pass: brevoPass },
        family: 4,
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: `"Portfolio Contact" <${emailFrom}>`,
        to: emailTo,
        replyTo: email,
        subject: `New Message from ${safeName}`,
        html: htmlContent,
      });

      console.log(`Email sent successfully via Brevo SMTP to ${emailTo}`);
      return res.status(200).json({ message: "Email sent successfully." });
    } catch (brevoErr) {
      console.warn("Brevo SMTP failed, trying Gmail fallback...", brevoErr.message);
    }
  }

  // 3. Fallback: Gmail Nodemailer
  const gmailUser = process.env.EMAIL_USER;
  const gmailPass = process.env.EMAIL_PASS;

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass },
        family: 4,
      });

      await transporter.sendMail({
        from: `"Portfolio Contact" <${gmailUser}>`,
        to: emailTo,
        replyTo: email,
        subject: `New Message from ${safeName}`,
        html: htmlContent,
      });

      console.log(`Email sent successfully via Gmail fallback to ${emailTo}`);
      return res.status(200).json({ message: "Email sent successfully." });
    } catch (error) {
      console.error("Gmail fallback failed:", error.message);
    }
  }

  console.error("All email dispatch methods failed or credentials missing on server.");
  return res.status(500).json({
    error: "Failed to send email.",
    detail: "Email dispatch failed. Please verify environment variables on Render (BREVO_API_KEY / BREVO_SMTP_PASS).",
  });
};