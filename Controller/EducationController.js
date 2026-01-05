import Education from "../Modules/EducationModule.js";

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
    if (checkPercentage(diplapercentage)) return res.status(400).json({ message: "Diploma percentage must be 0-100" });
    if (checkCgpa(ugCgpa)) return res.status(400).json({ message: "UG CGPA must be 0-10" });
    if (checkCgpa(pgCgpa)) return res.status(400).json({ message: "PG CGPA must be 0-10" });

    // ===== AUTO DETERMINE HIGHEST QUALIFICATION =====
    let highestQualification = "UG"; // default
    if (phdInstituteName || phdUniversityName || phdResearchArea || phdYearOfPassing) highestQualification = "PhD";
    else if (pgInstituteName || pgUniversityName || pgDegree || pgDepartmentCourse || pgYearOfPassing) highestQualification = "PG";
    else if (ugInstituteName) highestQualification = "UG";
    else if (diplomainstitution) highestQualification = "DIPLOMA";
    else if (itiinstituteName) highestQualification = "ITI"; // ITI considered as DIPLOMA
    else if (hscSchoolName) highestQualification = "HSC";
    else highestQualification = "SSLC";

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
    if (checkPercentage(updateData.diplapercentage)) return res.status(400).json({ message: "Diploma percentage must be 0-100" });
    if (checkCgpa(updateData.ugCgpa)) return res.status(400).json({ message: "UG CGPA must be 0-10" });
    if (checkCgpa(updateData.pgCgpa)) return res.status(400).json({ message: "PG CGPA must be 0-10" });

    // Auto-update highestQualification
    if (updateData.phdInstituteName || updateData.phdUniversityName || updateData.phdResearchArea || updateData.phdYearOfPassing)
      updateData.highestQualification = "PhD";
    else if (updateData.pgInstituteName || updateData.pgUniversityName || updateData.pgDegree || updateData.pgDepartmentCourse || updateData.pgYearOfPassing)
      updateData.highestQualification = "PG";
    else if (updateData.ugInstituteName) updateData.highestQualification = "UG";
    else if (updateData.diplomainstitution) updateData.highestQualification = "DIPLOMA";
    else if (updateData.itiinstituteName) updateData.highestQualification = "DIPLOMA";
    else if (updateData.hscSchoolName) updateData.highestQualification = "HSC";
    else if (updateData.sslcSchoolName) updateData.highestQualification = "SSLC";

    const education = await Education.findOneAndUpdate({ userId }, updateData, { new: true });
    if (!education) return res.status(404).json({ message: "Education not found" });

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
