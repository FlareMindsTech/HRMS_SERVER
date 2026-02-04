import CurrentCompany from "../Modules/CurrentCompanyModule.js";

export const createCurrentCompany = async (req, res) => {
  try {
    const {
      userId,
      department,
      designation,
      role,
      salary,
      joiningDate,
      reportedTo,
      isFresher
    } = req.body;

    const existing = await CurrentCompany.findOne({ userId });
    if (existing) {
      return res.status(400).json({
        message: "Current company already exists for this user"
      });
    }

    const currentCompany = await CurrentCompany.create({
      userId,
      department,
      designation,
      role,
      salary,
      joiningDate,
      reportedTo,
      isFresher
    });

    return res.status(201).json({
      message: "Current company created successfully",
      data: currentCompany
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating current company",
      error: error.message
    });
  }
};


export const getCurrentCompanyByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentCompany = await CurrentCompany.findOne({ userId });

    if (!currentCompany) {
      return res.status(404).json({
        message: "Current company not found"
      });
    }

    return res.status(200).json({
      data: currentCompany
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching current company",
      error: error.message
    });
  }
};


 
export const updateCurrentCompany = async (req, res) => {
  try {
    const { userId } = req.params;

    const updatedCompany = await CurrentCompany.findOneAndUpdate(
      { userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({
        message: "Current company not found"
      });
    }

    return res.status(200).json({
      message: "Current company updated successfully",
      data: updatedCompany
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating current company",
      error: error.message
    });
  }
};

export const deleteCurrentCompany = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedCompany = await CurrentCompany.findOneAndDelete({ userId });

    if (!deletedCompany) {
      return res.status(404).json({
        message: "Current company not found"
      });
    }

    return res.status(200).json({
      message: "Current company deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting current company",
      error: error.message
    });
  }
};


export const getAllCurrentCompanies = async (req, res) => {
  try {
    const companies = await CurrentCompany.find()
      .populate("userId", "firstName lastName email mobileNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: companies.length,
      data: companies
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching current companies",
      error: error.message
    });
  }
};

