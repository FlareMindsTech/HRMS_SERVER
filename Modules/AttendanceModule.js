import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    date: {
      type: String,
      required: true
    },

    loginTime: {
      type: Date,
      required: true
    },

    logoutTime: {
      type: Date
    },

    totalWorkingMinutes: {
      type: Number,
      default: 0
    },

    totalHours: {
      type: Number,
      default: 0
    },

    locationType: {
      type: String,
      enum: ["Office", "WFH"],
      required: true
    },

    status: {
      type: String,
      enum: ["Present", "Half Day", "Absent", "Leave"],
      default: "Present"
    },

    isLate: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);