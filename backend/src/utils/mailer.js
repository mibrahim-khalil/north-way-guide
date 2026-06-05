import nodemailer from "nodemailer";

export function makeTransport() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";

 
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    family: 4,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function fromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER;
}

export async function sendOtpEmail({ to, code }) {
  const transport = makeTransport();

  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: "North Way Guide - Email Verification Code",
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const transport = makeTransport();

  await transport.sendMail({
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