function parseFrom(fromStr) {
  const s = String(fromStr || "").trim();
  const m = s.match(/^(.*)<([^>]+)>$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ""), email: m[2].trim() };
  return { name: "North Way Guide", email: s };
}

function fromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@northwayguide.com";
}

async function sendViaBrevo({ to, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY missing");

  const sender = parseFrom(fromAddress());

  // timeout
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);

  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html || undefined,
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(t));

  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`Brevo API error ${r.status}: ${body}`);
  }
}

export async function sendOtpEmail({ to, code }) {
  await sendViaBrevo({
    to,
    subject: "North Way Guide - Email Verification Code",
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  await sendViaBrevo({
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