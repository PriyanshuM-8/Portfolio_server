import nodemailer from "nodemailer";

export const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message)
    return res.status(400).json({ error: "All fields are required." });

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      family: 4,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // verify connection before sending
    await transporter.verify();

    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `New Message from ${name}`,
      html: `
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
      `,
    });

    res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    console.error("Email error code  :", error.code);
    console.error("Email error message:", error.message);
    console.error("Email response     :", error.response);
    res.status(500).json({
      error: "Failed to send email.",
      detail: error.message,
      code: error.code,
    });
  }
};
