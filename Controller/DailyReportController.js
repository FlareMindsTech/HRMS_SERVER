import DailyReport from "../Modules/DailyReportModule.js";

export const submitDailyReport = async (req, res) => {
  try {
    const {
      projectId,
      reportDate,
      shift,
      title,
      description,
      preference,
      referenceLink
    } = req.body;

    if (!projectId || !reportDate || !shift || !title || !description) {
      return res.status(400).json({
        message: "Project, report date, shift, title, and description are required"
      });
    }

    const date = new Date(reportDate);
    date.setHours(0, 0, 0, 0);

    const report = await DailyReport.create({
      submittedBy: req.user.id,
      projectId,
      reportDate: date,
      shift,
      title,
      description,
      preference,
      referenceLink
    });

    return res.status(201).json({
      success: true,
      message: "Daily report submitted successfully",
      data: report
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Daily report already exists for this project, date, and shift"
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyDailyReports = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = { submittedBy: req.user.id };
    if (projectId) filter.projectId = projectId;

    const reports = await DailyReport.find(filter)
      .populate("projectId", "projectName")
      .sort({ reportDate: -1, shift: 1 });

    return res.status(200).json({ success: true, data: reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDailyReportsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.query;

    const filter = { projectId };
    if (userId) filter.submittedBy = userId;

    const reports = await DailyReport.find(filter)
      .populate("submittedBy", "firstName lastName email employeeCode role")
      .populate("projectId", "projectName")
      .sort({ reportDate: -1, shift: 1 });

    return res.status(200).json({ success: true, data: reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllDailyReports = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = {};
    if (projectId) filter.projectId = projectId;

    const reports = await DailyReport.find(filter)
      .populate("submittedBy", "firstName lastName email employeeCode")
      .populate("projectId", "projectName")
      .sort({ reportDate: -1, shift: 1 });

    return res.status(200).json({ success: true, data: reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDailyReportById = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id)
      .populate("submittedBy", "firstName lastName email")
      .populate("projectId", "projectName");

    if (!report) {
      return res.status(404).json({ success: false, message: "Daily report not found" });
    }

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDailyReport = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: "Daily report not found" });
    }

    await report.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Daily report deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};