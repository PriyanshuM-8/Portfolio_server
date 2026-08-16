import nodemailer from "nodemailer";

export const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      error: "All fields are required.",
    });
  }

  const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.BREVO_SMTP_PORT) || 587;
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS;
  const emailFrom = (process.env.EMAIL_FROM || "priyanshumaddeshiya72@gmail.com").replace(/<|>/g, "").trim();
  const emailTo = (process.env.EMAIL_TO || "maddeshiyapriyanshu2@gmail.com").replace(/<|>/g, "").trim();

  if (!user || !pass) {
    console.error("Email configuration error: BREVO_SMTP_USER or BREVO_SMTP_PASS is not set in environment variables.");
    return res.status(500).json({
      error: "Server email credentials missing.",
      detail: "BREVO_SMTP_USER or BREVO_SMTP_PASS environment variable is missing on server.",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // true for 465, false for other ports like 587 / 2525
      auth: {
        user,
        pass,
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 20000,
    });

    await transporter.sendMail({
      from: `"Portfolio Contact" <${emailFrom}>`,
      to: emailTo,
      replyTo: email,
      subject: `New Message from ${name}`,

      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          
          <div style="background:#c98826;padding:20px 24px">
            <h2 style="color:#000;margin:0;font-size:18px">
              New Portfolio Message
            </h2>
          </div>

          <div style="padding:24px">
            <p style="margin:0 0 12px">
              <b>Name:</b> ${name}
            </p>

            <p style="margin:0 0 12px">
              <b>Email:</b>
              <a href="mailto:${email}">
                ${email}
              </a>
            </p>

            <p style="margin:0 0 8px">
              <b>Message:</b>
            </p>

            <p style="background:#f8fafc;padding:12px;border-radius:6px;margin:0;white-space:pre-wrap">
              ${message}
            </p>
          </div>

          <div style="background:#f1f5f9;padding:12px 24px;font-size:12px;color:#64748b">
            Sent from your portfolio contact form
          </div>

        </div>
      `,
    });

    return res.status(200).json({
      message: "Email sent successfully.",
    });

  } catch (error) {
    console.error("Email error code:", error.code);
    console.error("Email error message:", error.message);
    console.error("Email response:", error.response);

    return res.status(500).json({
      error: "Failed to send email.",
      detail: error.message || "Internal server error during email dispatch.",
      code: error.code || "EUNKNOWN",
    });
  }
};