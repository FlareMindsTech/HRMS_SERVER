import Onboarding from "../Modules/OnboardingModule.js";
import User from "../Modules/UserModule.js";
import Role from "../Modules/RoleModules.js";
import bcrypt from "bcrypt";
import { logAudit } from "../Utils/AuditLogger.js";
import { getPagination, formatPaginatedResponse } from "../Utils/Pagination.js";
import { canAssignRole } from "../Utils/RoleAuthority.js";

// Helper to generate next unique Employee Code EMP0001
const generateNextEmployeeCode = async () => {
  const lastUser = await User.findOne({ employeeCode: { $regex: /^EMP/ } })
    .sort({ createdAt: -1 })
    .select("employeeCode")
    .lean();

  if (!lastUser || !lastUser.employeeCode) {
    return "EMP0001";
  }

  const numPart = parseInt(lastUser.employeeCode.replace(/\D/g, ""), 10);
  const nextNum = isNaN(numPart) ? 1 : numPart + 1;
  return `EMP${String(nextNum).padStart(4, "0")}`;
};

// 1. Initiate Employee Onboarding & Create User Record
export const initiateOnboarding = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      dob,
      gender,
      marriageStatus,
      mobileNo,
      roleId,
      department,
      designation,
      reportingManager,
      joiningDate,
      employmentType,
      bankDetails,
      statutoryDetails,
      emergencyContact,
      tasks,
    } = req.body;

    if (!firstName || !lastName || !email || !mobileNo || !dob || !gender || !marriageStatus || !roleId) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, mobile number, DOB, gender, marriage status, and role ID are required.",
      });
    }

    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { mobileNo }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An employee with this email or mobile number already exists.",
      });
    }

    let role;
    if (roleId) {
      role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({ success: false, message: "Specified Role ID not found." });
      }
      if (!canAssignRole(req.user, role)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You do not have authority to assign role '${role.roleName}'.`,
        });
      }
    } else {
      role = await Role.findOne({ roleCode: "EMPLOYEE" });
    }

    const employeeCode = await generateNextEmployeeCode();
    const rawPassword = password || "Welcome@123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Create User with ONBOARDING status and hasLoginAccess = false by default
    const newUser = await User.create({
      firstName,
      middleName,
      lastName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      dob: new Date(dob),
      gender,
      marriageStatus,
      mobileNo: mobileNo.trim(),
      employeeCode,
      role: role ? role._id : null,
      reportingManager: reportingManager || null,
      tlCode: reportingManager || null,
      department: department || "General",
      designation: designation || "Employee",
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      employmentType: employmentType || "FULL_TIME",
      lifecycleStatus: "ONBOARDING",
      hasLoginAccess: false,
      bankDetails: bankDetails || {},
      statutoryDetails: statutoryDetails || {},
      emergencyContact: emergencyContact || {},
    });

    const defaultTasks = [
      { taskName: "Verify Government Identity Proofs (PAN/Aadhaar)", category: "HR_DOCUMENT" },
      { taskName: "Collect Signed Employment Contract & Offer Letter", category: "HR_DOCUMENT" },
      { taskName: "Create Corporate Email & Slack Accounts", category: "IT_PROVISIONING" },
      { taskName: "Issue Laptop & IT Accessories", category: "ASSET_ALLOCATION" },
      { taskName: "Schedule Orientation & Department Intro", category: "TRAINING" },
    ];

    const onboardingRecord = await Onboarding.create({
      employeeId: newUser._id,
      status: "PENDING",
      startDate: new Date(),
      tasks: tasks && Array.isArray(tasks) && tasks.length > 0 ? tasks : defaultTasks,
      provisionedAccess: [
        { systemName: "Email Account", isProvisioned: false },
        { systemName: "HRMS Portal", isProvisioned: true, provisionedAt: new Date() },
        { systemName: "Code Repository / Tools", isProvisioned: false },
      ],
      createdBy: req.user.id,
    });

    await logAudit({
      req,
      action: "INITIATE_ONBOARDING",
      module: "ONBOARDING",
      resourceId: onboardingRecord._id.toString(),
      newState: { user: newUser.toObject(), onboarding: onboardingRecord.toObject() },
      details: `Initiated onboarding for employee ${employeeCode} (${email})`,
    });

    return res.status(201).json({
      success: true,
      message: "Employee onboarding initiated successfully.",
      data: {
        user: {
          _id: newUser._id,
          employeeCode: newUser.employeeCode,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          lifecycleStatus: newUser.lifecycleStatus,
        },
        onboarding: onboardingRecord,
      },
    });
  } catch (error) {
    console.error("initiateOnboarding Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Onboarding Records
export const getAllOnboardings = async (req, res) => {
  try {
    const { page, limit, skip, sort } = getPagination(req.query);
    const { status, search } = req.query;

    const query = {};
    if (status) query.status = status;

    const list = await Onboarding.find(query)
      .populate({
        path: "employeeId",
        select: "firstName lastName email employeeCode department designation joiningDate mobileNo",
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Onboarding.countDocuments(query);

    return res.status(200).json(formatPaginatedResponse({ data: list, total, page, limit }));
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update Onboarding Task Status
export const updateOnboardingTask = async (req, res) => {
  try {
    const { onboardingId, taskId } = req.params;
    const { isCompleted, notes } = req.body;

    const record = await Onboarding.findById(onboardingId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Onboarding record not found." });
    }

    const task = record.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    task.isCompleted = isCompleted !== undefined ? isCompleted : task.isCompleted;
    if (task.isCompleted) {
      task.completedAt = new Date();
    }
    if (notes) task.notes = notes;

    // Recalculate status
    const totalTasks = record.tasks.length;
    const completedTasks = record.tasks.filter((t) => t.isCompleted).length;

    if (completedTasks === 0) {
      record.status = "PENDING";
    } else if (completedTasks < totalTasks) {
      record.status = "IN_PROGRESS";
    } else {
      record.status = "COMPLETED";
      record.completedDate = new Date();

      // Automatically transition Employee lifecycle status to ACTIVE
      await User.findByIdAndUpdate(record.employeeId, { lifecycleStatus: "ACTIVE" });
    }

    await record.save();

    await logAudit({
      req,
      action: "UPDATE_ONBOARDING_TASK",
      module: "ONBOARDING",
      resourceId: record._id.toString(),
      newState: record.toObject(),
      details: `Updated onboarding task ${task.taskName} to completed=${task.isCompleted}`,
    });

    return res.status(200).json({
      success: true,
      message: "Onboarding task updated successfully.",
      data: record,
    });
  } catch (error) {
    console.error("updateOnboardingTask Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Complete Onboarding & Activate Employee
export const completeOnboarding = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await Onboarding.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Onboarding record not found." });
    }

    record.status = "COMPLETED";
    record.completedDate = new Date();
    record.tasks.forEach((t) => {
      t.isCompleted = true;
      t.completedAt = t.completedAt || new Date();
    });

    await record.save();

    // Set User lifecycleStatus to ACTIVE
    await User.findByIdAndUpdate(record.employeeId, { lifecycleStatus: "ACTIVE" });

    await logAudit({
      req,
      action: "COMPLETE_ONBOARDING",
      module: "ONBOARDING",
      resourceId: record._id.toString(),
      details: `Completed onboarding for employee ${record.employeeId}`,
    });

    return res.status(200).json({
      success: true,
      message: "Employee onboarding marked as COMPLETED and lifecycle status updated to ACTIVE.",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
