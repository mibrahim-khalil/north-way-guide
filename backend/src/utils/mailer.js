function parseFrom(fromStr) {
  const s = String(fromStr || "").trim();
  const m = s.match(/^(.*)<([^>]+)>$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ""), email: m[2].trim() };
  return { name: "North Way Guide", email: s };
}

function fromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "North Way Guide <noreply@northwayguide.com>";
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
  const subject = "North Way Guide — Email Verification Code";

  const text = `Dear User,

Thank you for registering with North Way Guide.

To complete your account verification, please use the verification code below:

Verification Code: ${code}

This code will expire in 10 minutes for security purposes.

If you did not create an account, please ignore this email.

Best Regards,
North Way Guide Team
AI-Powered Tourism Platform & Marketplace
`;

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
    <h2 style="margin: 0 0 12px;">North Way Guide — Verify Your Email</h2>

    <p>Dear User,</p>

    <p>Thank you for registering with <b>North Way Guide</b>.</p>

    <p>To complete your account verification, please use the verification code below:</p>

    <div style="margin: 18px 0; padding: 14px 16px; border: 1px solid rgba(15,23,42,0.12); border-radius: 10px; background: #f8fafc;">
      <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Verification Code</div>
      <div style="font-size: 26px; font-weight: 800; letter-spacing: 4px;">${code}</div>
    </div>

    <p style="margin-top: 0;">
      This code will expire in <b>10 minutes</b> for security purposes.
    </p>

    <p style="color:#475569;">
      If you did not create an account, please ignore this email.
    </p>

    <p style="margin-top: 18px;">
      Best Regards,<br />
      <b>North Way Guide Team</b><br />
      <span style="color:#64748b;">AI-Powered Tourism Platform &amp; Marketplace</span>
    </p>

    <hr style="border:none; border-top:1px solid rgba(15,23,42,0.10); margin:18px 0;" />
    <p style="font-size: 12px; color: #64748b; margin: 0;">
      Please do not share this code with anyone.
    </p>
  </div>
  `;

  await sendViaBrevo({ to, subject, text, html });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const subject = "North Way Guide — Reset Your Password";

  const text = `Dear User,

We received a request to reset the password for your North Way Guide account.

Use the link below to set a new password (valid for 30 minutes):
${resetUrl}

If you did not request this password reset, you can safely ignore this email.

Best Regards,
North Way Guide Team
AI-Powered Tourism Platform & Marketplace
`;

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
    <h2 style="margin: 0 0 12px;">Reset Your Password</h2>

    <p>Dear User,</p>

    <p>
      We received a request to reset the password for your <b>North Way Guide</b> account.
    </p>

    <p>
      Click the button below to set a new password. This link is valid for <b>30 minutes</b>.
    </p>

    <p style="margin: 18px 0;">
      <a href="${resetUrl}"
         style="display: inline-block; padding: 12px 16px; border-radius: 10px; background: #0b1324; color: #ffffff; text-decoration: none; font-weight: 800;">
        Reset Password
      </a>
    </p>

    <p style="font-size: 13px; color:#475569; margin-top: 0;">
      If the button doesn’t work, copy and paste this link into your browser:
      <br />
      <a href="${resetUrl}" style="color:#2563eb; word-break: break-all;">${resetUrl}</a>
    </p>

    <p style="color:#475569;">
      If you did not request this password reset, you can safely ignore this email.
    </p>

    <p style="margin-top: 18px;">
      Best Regards,<br />
      <b>North Way Guide Team</b><br />
      <span style="color:#64748b;">AI-Powered Tourism Platform &amp; Marketplace</span>
    </p>

    <hr style="border:none; border-top:1px solid rgba(15,23,42,0.10); margin:18px 0;" />
    <p style="font-size: 12px; color: #64748b; margin: 0;">
      For your security, do not share password reset links with anyone.
    </p>
  </div>
  `;

  await sendViaBrevo({ to, subject, text, html });
}