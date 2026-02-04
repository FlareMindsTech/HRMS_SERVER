import Education from "../Modules/EducationModule.js";

// ===== HELPER TO DETERMINE HIGHEST QUALIFICATION =====
const calculateHighestQualification = (data, existing = {}) => {
  const get = (key) => (data[key] !== undefined ? data[key] : existing[key]);

  if (get("phdInstituteName") || get("phdUniversityName") || get("phdYearOfPassing")) return "PhD";
  if (get("pgInstituteName") || get("pgUniversityName") || get("pgDegree") || get("pgYearOfPassing")) return "PG";
  if (get("ugInstituteName") || get("ugUniversityName") || get("ugDegree") || get("ugYearOfPassing")) return "UG";
  if (get("diplomainstitution") || get("diplomacourse") || get("diplomayearOfPassing")) return "DIPLOMA";
  if (get("itiinstituteName") || get("iticourse") || get("itiyearOfPassing")) return "ITI";
  if (get("hscSchoolName")) return "HSC";
  return "SSLC";
};

// ===== CREATE EDUCATION =====
export const createEducation = async (req, res) => {
  try {
    const {
      userId,
      sslcSchoolName,
      sslcBoard,
      sslcYearOfPassing,
      sslcPercentage,
      hscSchoolName,
      hscBoard,
      hscYearOfPassing,
      hscPercentage,
      itiinstituteName,
      iticourse,
      itiduration,
      itiyearOfPassing,
      itipercentage,
      diplomainstitution,
      diplomacourse,
      diplomaduration,
      diplomayearOfPassing,
      diplomapercentage,
      ugInstituteName,
      ugUniversityName,
      ugDegree,
      ugDepartmentCourse,
      ugYearOfPassing,
      ugCgpa,
      pgInstituteName,
      pgUniversityName,
      pgDegree,
      pgDepartmentCourse,
      pgYearOfPassing,
      pgCgpa,
      phdInstituteName,
      phdUniversityName,
      phdResearchArea,
      phdYearOfPassing,
      remarks
    } = req.body;

    // ===== MANDATORY FIELDS VALIDATION =====
    if (!userId) return res.status(400).json({ message: "userId is required" });

    if (!sslcSchoolName || !sslcBoard || !sslcYearOfPassing || sslcPercentage === undefined)
      return res.status(400).json({ message: "SSLC details are mandatory" });

    if (!hscSchoolName || !hscBoard || !hscYearOfPassing || hscPercentage === undefined)
      return res.status(400).json({ message: "HSC details are mandatory" });

    if (!ugInstituteName || !ugUniversityName || !ugDegree || !ugDepartmentCourse || !ugYearOfPassing || ugCgpa === undefined)
      return res.status(400).json({ message: "UG details are mandatory" });

    // ===== RANGE VALIDATIONS =====
    const checkPercentage = (val) => val !== undefined && (val < 0 || val > 100);
    const checkCgpa = (val) => val !== undefined && (val < 0 || val > 10);

    if (checkPercentage(sslcPercentage)) return res.status(400).json({ message: "SSLC percentage must be 0-100" });
    if (checkPercentage(hscPercentage)) return res.status(400).json({ message: "HSC percentage must be 0-100" });
    if (checkPercentage(itipercentage)) return res.status(400).json({ message: "ITI percentage must be 0-100" });
    if (checkPercentage(diplomapercentage)) return res.status(400).json({ message: "Diploma percentage must be 0-100" });
    if (checkCgpa(ugCgpa)) return res.status(400).json({ message: "UG CGPA must be 0-10" });
    if (checkCgpa(pgCgpa)) return res.status(400).json({ message: "PG CGPA must be 0-10" });

    // ===== CHECK IF ALREADY EXISTS =====
    const existingEducation = await Education.findOne({ userId });
    if (existingEducation) {
      return res.status(400).json({ message: "Education record already exists for this user. Use PUT to update." });
    }

    const highestQualification = calculateHighestQualification(req.body);

    // ===== CREATE EDUCATION DOCUMENT =====
    const education = new Education({
      userId,
      sslcSchoolName,
      sslcBoard,
      sslcYearOfPassing,
      sslcPercentage,
      hscSchoolName,
      hscBoard,
      hscYearOfPassing,
      hscPercentage,
      itiinstituteName: itiinstituteName || undefined,
      iticourse: iticourse || undefined,
      itiduration: itiduration || undefined,
      itiyearOfPassing: itiyearOfPassing || undefined,
      itipercentage: itipercentage || undefined,
      diplomainstitution: diplomainstitution || undefined,
      diplomacourse: diplomacourse || undefined,
      diplomaduration: diplomaduration || undefined,
      diplomayearOfPassing: diplomayearOfPassing || undefined,
      diplomapercentage: diplomapercentage || undefined,
      ugInstituteName,
      ugUniversityName,
      ugDegree,
      ugDepartmentCourse,
      ugYearOfPassing,
      ugCgpa,
      pgInstituteName: pgInstituteName || undefined,
      pgUniversityName: pgUniversityName || undefined,
      pgDegree: pgDegree || undefined,
      pgDepartmentCourse: pgDepartmentCourse || undefined,
      pgYearOfPassing: pgYearOfPassing || undefined,
      pgCgpa: pgCgpa || undefined,
      phdInstituteName: phdInstituteName || undefined,
      phdUniversityName: phdUniversityName || undefined,
      phdResearchArea: phdResearchArea || undefined,
      phdYearOfPassing: phdYearOfPassing || undefined,
      highestQualification,
      remarks: remarks || undefined
    });

    await education.save();
    res.status(201).json({ message: "Education created successfully", education });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ===== GET EDUCATION BY USER =====
export const getEducationByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const education = await Education.findOne({ userId });
    if (!education) return res.status(404).json({ message: "Education not found" });
    res.status(200).json(education);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ===== UPDATE EDUCATION =====
export const updateEducation = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Validate percentages and CGPA before updating
    const checkPercentage = (val) => val !== undefined && (val < 0 || val > 100);
    const checkCgpa = (val) => val !== undefined && (val < 0 || val > 10);

    if (checkPercentage(updateData.sslcPercentage)) return res.status(400).json({ message: "SSLC percentage must be 0-100" });
    if (checkPercentage(updateData.hscPercentage)) return res.status(400).json({ message: "HSC percentage must be 0-100" });
    if (checkPercentage(updateData.itipercentage)) return res.status(400).json({ message: "ITI percentage must be 0-100" });
    if (checkPercentage(updateData.diplomapercentage)) return res.status(400).json({ message: "Diploma percentage must be 0-100" });
    if (checkCgpa(updateData.ugCgpa)) return res.status(400).json({ message: "UG CGPA must be 0-10" });
    if (checkCgpa(updateData.pgCgpa)) return res.status(400).json({ message: "PG CGPA must be 0-10" });

    const existing = await Education.findOne({ userId });
    if (!existing) return res.status(404).json({ message: "Education record not found" });

    updateData.highestQualification = calculateHighestQualification(updateData, existing);

    const education = await Education.findOneAndUpdate({ userId }, updateData, { new: true });
    res.status(200).json({ message: "Education updated successfully", education });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ===== DELETE EDUCATION =====
export const deleteEducation = async (req, res) => {
  try {
    const { userId } = req.params;
    const education = await Education.findOneAndDelete({ userId });
    if (!education) return res.status(404).json({ message: "Education not found" });
    res.status(200).json({ message: "Education deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ===== GET ALL EDUCATION =====
export const getAllEducation = async (req, res) => {
  try {
    const educations = await Education.find().populate("userId", "name email");
    res.status(200).json(educations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
