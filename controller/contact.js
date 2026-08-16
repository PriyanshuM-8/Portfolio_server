import nodemailer from "nodemailer";

export const verifyEmailService = async () => {
  const user = process.env.EMAIL_USER || "priyanshupm9@gmail.com";
  const pass = process.env.EMAIL_PASS || "vxwsafhtzyxshrkv";

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      family: 4, // Force IPv4 to fix Render ENETUNREACH IPv6 error
    });
    await transporter.verify();
    console.log(`✅ [EMAIL SERVICE] Gmail Transporter Connected & Ready! (${user})`);
  } catch (err) {
    console.log(`❌ [EMAIL SERVICE] Email Transporter Error: ${err.message}`);
  }
};

export const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      error: "All fields are required.",
    });
  }

  const emailUser = process.env.EMAIL_USER || "priyanshupm9@gmail.com";
  const emailPass = process.env.EMAIL_PASS || "vxwsafhtzyxshrkv";
  const emailTo = (process.env.EMAIL_TO || "maddeshiyapriyanshu2@gmail.com").replace(/<|>/g, "").trim();

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

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      family: 4, // Force IPv4 to fix Render ENETUNREACH IPv6 error
    });

    await transporter.sendMail({
      from: `"Portfolio Contact" <${emailUser}>`,
      to: emailTo,
      replyTo: email,
      subject: `New Message from ${name}`,
      html: htmlContent,
    });

    console.log(`Email sent successfully via Gmail to ${emailTo}`);
    return res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    console.error("Gmail error:", error.message);
    return res.status(500).json({
      error: "Failed to send email.",
      detail: error.message || "Internal server error during email dispatch.",
    });
  }
};