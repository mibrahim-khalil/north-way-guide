import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    
    title: { type: String, default: "", trim: true },

    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model("Chat", chatSchema);