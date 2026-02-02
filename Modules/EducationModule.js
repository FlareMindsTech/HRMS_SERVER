import mongoose from "mongoose";

const toTitleCase = (str) => {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const educationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ===== SSLC (Mandatory) =====
    sslcSchoolName: { type: String, required: true, trim: true, set: toTitleCase },
    sslcBoard: { type: String, required: true, trim: true, set: toTitleCase },
    sslcYearOfPassing: { type: Number, required: true, min: 1900 },
    sslcPercentage: { type: Number, required: true, min: 0, max: 100 },

    // ===== HSC (Mandatory) =====
    hscSchoolName: { type: String, required: true, trim: true, set: toTitleCase },
    hscBoard: { type: String, required: true, trim: true, set: toTitleCase },
    hscYearOfPassing: { type: Number, required: true, min: 1900 },
    hscPercentage: { type: Number, required: true, min: 0, max: 100 },

    // ===== ITI / Diploma / Polytechnic (Optional) =====
    itiinstituteName: { type: String, trim: true, set: toTitleCase },
    iticourse: { type: String, trim: true, set: toTitleCase },
    itiduration: { type: String, trim: true, set: toTitleCase },
    itiyearOfPassing: { type: Number, min: 1900 },
    itipercentage: { type: Number, min: 0, max: 100 },

    diplomainstitution: { type: String, trim: true, set: toTitleCase },
    diplomacourse: { type: String, trim: true, set: toTitleCase },
    diplomaduration: { type: String, trim: true, set: toTitleCase },
    diplomayearOfPassing: { type: Number, min: 1900 },
    diplomapercentage: { type: Number, min: 0, max: 100 },

    // ===== UG (Mandatory) =====
    ugInstituteName: { type: String, required: true, trim: true, set: toTitleCase },
    ugUniversityName: { type: String, required: true, trim: true, set: toTitleCase },
    ugDegree: { type: String, required: true, trim: true, set: toTitleCase },
    ugDepartmentCourse: { type: String, required: true, trim: true, set: toTitleCase },
    ugYearOfPassing: { type: Number, required: true, min: 1900 },
    ugCgpa: { type: Number, required: true, min: 0, max: 10 },

    // ===== PG (Optional) =====
    pgInstituteName: { type: String, trim: true, set: toTitleCase },
    pgUniversityName: { type: String, trim: true, set: toTitleCase },
    pgDegree: { type: String, trim: true, set: toTitleCase },
    pgDepartmentCourse: { type: String, trim: true, set: toTitleCase },
    pgYearOfPassing: { type: Number, min: 1900 },
    pgCgpa: { type: Number, min: 0, max: 10 },

    // ===== PhD (Optional) =====
    phdInstituteName: { type: String, trim: true, set: toTitleCase },
    phdUniversityName: { type: String, trim: true, set: toTitleCase },
    phdResearchArea: { type: String, trim: true, set: toTitleCase },
    phdYearOfPassing: { type: Number, min: 1900 },

    // ===== SYSTEM FIELDS =====
    highestQualification: {
      type: String,
      enum: ["SSLC", "HSC", "ITI", "DIPLOMA", "UG", "PG", "PhD"],
      default: "UG",
    },
    isVerified: { type: Boolean, default: false },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Education", educationSchema);
