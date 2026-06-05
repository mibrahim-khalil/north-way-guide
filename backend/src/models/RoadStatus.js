import mongoose from "mongoose";

const roadStatusSchema = new mongoose.Schema(
  {
    roadKey: { type: String, enum: ["BABUSAR", "KKH"], required: true, index: true },
    from: { type: Date, required: true, index: true },
    to: { type: Date, required: true, index: true },
    isOpen: { type: Boolean, required: true },

    reason: { type: String, default: "" },
    note: { type: String, default: "" },

    sourceName: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },

    updatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

roadStatusSchema.index({ roadKey: 1, from: 1, to: 1 });

export default mongoose.model("RoadStatus", roadStatusSchema);