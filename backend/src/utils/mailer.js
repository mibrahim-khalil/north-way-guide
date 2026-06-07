import nodemailer from "nodemailer";

export function makeTransport() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);

  // Gmail: 465 = secure true, 587 = secure false
  const secure = port === 465;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER/SMTP_PASS missing in environment variables");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },

    // IMPORTANT: prevent hanging forever on Render
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,

    // Helps some hosting environments
    tls: {
      servername: host,
    },
  });
}

function fromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER;
}

async function sendMailSafe(mailOptions) {
  const transport = makeTransport();

  // Optional: checks SMTP connection; will fail fast if wrong
  await transport.verify();

  return transport.sendMail(mailOptions);
}

export async function sendOtpEmail({ to, code }) {
  await sendMailSafe({
    from: fromAddress(),
    to,
    subject: "North Way Guide - Email Verification Code",
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  await sendMailSafe({
    from: fromAddress(),
    to,
    subject: "North Way Guide - Reset your password",
    text: `You requested a password reset.\n\nOpen this link to set a new password (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your North Way Guide account.</p>
        <p>This link is valid for <b>30 minutes</b>:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}