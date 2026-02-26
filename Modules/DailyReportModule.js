import mongoose from "mongoose";
const { Schema } = mongoose;

const toTitleCase = (str) => {
    if (!str) return str;
    return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const DailyReportSchema = new Schema(
    {
        submittedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        reportDate: {
            type: Date,
            required: [true, "Report date is required"],
            index: true
        },

        shift: {
            type: String,
            enum: {
                values: ["09:00-13:00", "14:00-18:00", "FULL_DAY"],
                message: "Invalid shift"
            },
            required: true
        },

        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: [5, "Title must be at least 5 characters"],
            maxlength: [100, "Title cannot exceed 100 characters"],
            set: toTitleCase
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            minlength: [10, "Description must be at least 10 characters"],
            maxlength: [1000, "Description too long"],
            set: toTitleCase
        },

        preference: {
            type: Number,
            enum: {
                values: [1, 2, 3],
                message: "Preference must be 1 (WFH), 2 (On Site), or 3 (Client Visit)"
            }
        },

        referenceLink: {
            type: String,
            trim: true
        },

        submittedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

DailyReportSchema.index(
    { submittedBy: 1, reportDate: 1, shift: 1 },
    { unique: true }
);

const DailyReport = mongoose.model("DailyReport", DailyReportSchema);
export default DailyReport;
