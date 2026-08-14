import mongoose from "mongoose";

const onboardingTaskSchema = new mongoose.Schema(
  {
    taskName: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["HR_DOCUMENT", "IT_PROVISIONING", "ASSET_ALLOCATION", "TRAINING", "OTHER"],
      default: "OTHER",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { _id: true }
);

const onboardingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    completedDate: { type: Date, default: null },
    tasks: [onboardingTaskSchema],
    assignedAssets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Asset" }],
    provisionedAccess: [{
      systemName: { type: String, required: true },
      isProvisioned: { type: Boolean, default: false },
      provisionedAt: { type: Date, default: null },
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Onboarding = mongoose.model("Onboarding", onboardingSchema);

export default Onboarding;
