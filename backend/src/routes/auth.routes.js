// backend/src/routes/auth.routes.js
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import { sendOtpEmail, sendPasswordResetEmail } from "../utils/mailer.js";

const router = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function signToken(user) {
  return jwt.sign({ userId: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function makeOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digitss
}

async function deliverOtp({ email, code, context }) {
  if (process.env.OTP_DEV_MODE === "true") {
    console.log(`DEV OTP (${context}) for ${email}: ${code}`);
    return;
  }
  await sendOtpEmail({ to: email, code });
}


function normalizeEmail(v) {
  return String(v || "").trim().toLowerCase();
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

function normalizePhone(v) {
  return String(v || "").replace(/\D/g, ""); 
}

function isValidPhone11(v) {
  return /^[0-9]{11}$/.test(String(v || ""));
}

router.post("/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });

    if (!user) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const publicOrigin = process.env.PUBLIC_ORIGIN || "http://localhost:5173";
    const resetUrl = `${publicOrigin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail({ to: user.email, resetUrl });

    return res.json({ ok: true });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.json({ ok: true });
  }
});

//reset password
router.post("/reset-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !token || !newPassword) return res.status(400).json({ message: "Missing fields" });
    if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordTokenHash = "";
    user.resetPasswordExpiresAt = null;
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

//register
router.post("/register", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const phone = normalizePhone(req.body?.phone);
    const accountType = String(req.body?.accountType || "AVAILER").toUpperCase();

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "Name, email, phone and password are required" });
    }

    if (!isValidEmail(email)) return res.status(400).json({ message: "Please enter a valid email address" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    if (!isValidPhone11(phone)) {
      return res.status(400).json({ message: "Phone must be exactly 11 digits" });
    }

    //  buyer/seller account option
    if (!["AVAILER", "SELLER"].includes(accountType)) {
      return res.status(400).json({ message: "Invalid accountType" });
    }

    //  Unique email and no
    const existsEmail = await User.findOne({ email });
    if (existsEmail) return res.status(409).json({ message: "Email already registered" });

    const existsPhone = await User.findOne({ phone });
    if (existsPhone) return res.status(409).json({ message: "Phone already registered" });

    const passwordHash = await bcrypt.hash(password, 10);

    const code = makeOtpCode();
    const emailOtpHash = await bcrypt.hash(code, 10);
    const emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const createdUser = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: "USER",
      accountType, 
      isEmailVerified: false,
      emailOtpHash,
      emailOtpExpiresAt,
    });

    try {
      await deliverOtp({ email, code, context: "register" });
    } catch (e) {
      await User.deleteOne({ _id: createdUser._id });
      console.error("OTP SEND FAILED (register) - user rolled back:", e.message);
      return res.status(500).json({ message: "Could not send verification code. Try again." });
    }

    return res.status(201).json({ ok: true, needsVerification: true, email });
  } catch (err) {
    if (err?.code === 11000) {
      const key = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({ message: `${key} already registered` });
    }
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();
    if (!email || !code) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isEmailVerified) {
      const token = signToken(user);
      res.cookie("token", token, cookieOptions);
      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || "",
          accountType: user.accountType || "AVAILER",
        },
      });
    }

    if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
      return res.status(400).json({ message: "No OTP found. Please resend code." });
    }

    if (user.emailOtpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Code expired. Please resend code." });
    }

    const ok = await bcrypt.compare(String(code), user.emailOtpHash);
    if (!ok) return res.status(400).json({ message: "Invalid code" });

    user.isEmailVerified = true;
    user.emailOtpHash = "";
    user.emailOtpExpiresAt = null;
    await user.save();

    const token = signToken(user);
    res.cookie("token", token, cookieOptions);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        accountType: user.accountType || "AVAILER",
      },
    });
  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);
    return res.status(500).json({ message: "Verification failed" });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isEmailVerified) return res.json({ ok: true });

    const code = makeOtpCode();
    user.emailOtpHash = await bcrypt.hash(code, 10);
    user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await deliverOtp({ email, code, context: "resend" });
    } catch (e) {
      console.error("OTP SEND FAILED (resend):", e.message);
      return res.status(500).json({ message: "Could not resend code. Try again." });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
    return res.status(500).json({ message: "Failed to resend code" });
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify your email." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    res.cookie("token", token, cookieOptions);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        accountType: user.accountType || "AVAILER",
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

// logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});


router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.userId).select(
      "name email phone role accountType createdAt isEmailVerified"
    );

    if (!user) return res.status(401).json({ message: "Not authenticated" });

    res.json({ user });
  } catch {
    res.status(401).json({ message: "Not authenticated" });
  }
});

export default router;