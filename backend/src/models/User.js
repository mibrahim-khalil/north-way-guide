import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    phone: { type: String, default: "", trim: true },

    passwordHash: { type: String, required: true },

    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },

    accountType: { type: String, enum: ["AVAILER", "SELLER"], default: "AVAILER" },

    isEmailVerified: { type: Boolean, default: false },
    emailOtpHash: { type: String, default: "" },
    emailOtpExpiresAt: { type: Date, default: null },

    resetPasswordTokenHash: { type: String, default: "" },
    resetPasswordExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: "string", $ne: "" } } }
);

export default mongoose.model("User", userSchema);