import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ===== SSLC (Mandatory) =====
    sslcSchoolName: { type: String, required: true, trim: true },
    sslcBoard: { type: String, required: true, trim: true },
    sslcYearOfPassing: { type: Number, required: true, min: 1900 },
    sslcPercentage: { type: Number, required: true, min: 0, max: 100 },

    // ===== HSC (Mandatory) =====
    hscSchoolName: { type: String, required: true, trim: true },
    hscBoard: { type: String, required: true, trim: true },
    hscYearOfPassing: { type: Number, required: true, min: 1900 },
    hscPercentage: { type: Number, required: true, min: 0, max: 100 },

    // ===== ITI / Diploma / Polytechnic (Optional) =====
    itiinstituteName: { type: String, trim: true },
    iticourse: { type: String, trim: true },
    itiduration: { type: String, trim: true },
    itiyearOfPassing: { type: Number, min: 1900 },
    itipercentage: { type: Number, min: 0, max: 100 },

    diplomainstitution: { type: String, trim: true },
    diplomacourse: { type: String, trim: true },
    diplomaduration: { type: String, trim: true },
    diplomayearOfPassing: { type: Number, min: 1900 },
    diplomapercentage: { type: Number, min: 0, max: 100 },

    // ===== UG (Mandatory) =====
    ugInstituteName: { type: String, required: true, trim: true },
    ugUniversityName: { type: String, required: true, trim: true },
    ugDegree: { type: String, required: true, trim: true },
    ugDepartmentCourse: { type: String, required: true, trim: true },
    ugYearOfPassing: { type: Number, required: true, min: 1900 },
    ugCgpa: { type: Number, required: true, min: 0, max: 10 },

    // ===== PG (Optional) =====
    pgInstituteName: { type: String, trim: true },
    pgUniversityName: { type: String, trim: true },
    pgDegree: { type: String, trim: true },
    pgDepartmentCourse: { type: String, trim: true },
    pgYearOfPassing: { type: Number, min: 1900 },
    pgCgpa: { type: Number, min: 0, max: 10 },

    // ===== PhD (Optional) =====
    phdInstituteName: { type: String, trim: true },
    phdUniversityName: { type: String, trim: true },
    phdResearchArea: { type: String, trim: true },
    phdYearOfPassing: { type: Number, min: 1900 },

    // ===== SYSTEM FIELDS =====
    highestQualification: {
      type: String,
      enum: ["SSLC", "HSC","ITI", "DIPLOMA", "UG", "PG", "PhD"],
      default: "UG",
    },
    isVerified: { type: Boolean, default: false },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Education", educationSchema);
