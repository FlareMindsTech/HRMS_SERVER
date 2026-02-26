import DailyReport from "../Modules/DailyReportModule.js";

export const submitDailyReport = async (req, res) => {
  try {
    const {
      reportDate,
      shift,
      title,
      description,
      preference,
      referenceLink
    } = req.body;

    if (!reportDate || !shift || !title || !description) {
      return res.status(400).json({
        message: "Report date, shift, title, and description are required"
      });
    }

    const date = new Date(reportDate);
    date.setHours(0, 0, 0, 0);

    const report = await DailyReport.create({
      submittedBy: req.user.id, 
      shift,
      title,
      description,
      preference,
      referenceLink
    });

    return res.status(201).json({
      message: "Daily report submitted successfully",
      data: report
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Daily report already exists for this date and shift"
      });
    }
    return res.status(500).json({ message: error.message });
  }
};


export const getMyDailyReports = async (req, res) => {
  try {
    const reports = await DailyReport.find({
      submittedBy: req.user.id
    }).sort({ reportDate: -1, shift: 1 });

    return res.status(200).json({ data: reports });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const getAllDailyReports = async (req, res) => {
  try {
    const reports = await DailyReport.find()
      .populate("submittedBy", "firstName lastName email")
      .sort({ reportDate: -1, shift: 1 });

    return res.status(200).json({ data: reports });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const getDailyReportById = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id)
      .populate("submittedBy", "firstName lastName email");

    if (!report) {
      return res.status(404).json({ message: "Daily report not found" });
    }

    return res.status(200).json({ data: report });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const deleteDailyReport = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Daily report not found" });
    }

    await report.deleteOne();

    return res.status(200).json({
      message: "Daily report deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};