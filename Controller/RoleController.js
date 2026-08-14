import mongoose from "mongoose";
import Role from "../Modules/RoleModules.js";

// ==========================================
// HELPER
// ==========================================

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ==========================================
// CREATE ROLE
// ==========================================

export const createRole = async (req, res) => {
  try {
    const { roleName, priority } = req.body;

    // ----------------------------------------
    // Validate role name
    // ----------------------------------------

    if (
      typeof roleName !== "string" ||
      !roleName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    const formattedRoleName = roleName
      .trim()
      .replace(/\s+/g, " ");

    // ----------------------------------------
    // Validate priority
    // ----------------------------------------

    if (
      priority === undefined ||
      priority === null ||
      priority === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Priority is required",
      });
    }

    const priorityNum = Number(priority);

    // ----------------------------------------
    // Privilege escalation check: Cannot create priority 1 or system owner role
    // ----------------------------------------
    if (priorityNum === 1 && req.user?.priority !== 1) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only initial system setup can create System Owner role (Priority 1).",
      });
    }

    // ----------------------------------------
    // Check duplicate role name
    // ----------------------------------------

    const nameExists = await Role.exists({
      roleName: {
        $regex: `^${escapeRegex(formattedRoleName)}$`,
        $options: "i",
      },
    });

    if (nameExists) {
      return res.status(409).json({
        success: false,
        message: "Role name already exists",
      });
    }

    // ----------------------------------------
    // Check duplicate priority
    // ----------------------------------------

    const priorityExists = await Role.exists({
      priority: priorityNum,
    });

    if (priorityExists) {
      return res.status(409).json({
        success: false,
        message: "Priority number already exists",
      });
    }

    // ----------------------------------------
    // Generate role code
    // ----------------------------------------

    const roleCode = formattedRoleName
      .replace(/\s+/g, "_")
      .toUpperCase();

    const roleCodeExists = await Role.exists({
      roleCode,
    });

    if (roleCodeExists) {
      return res.status(409).json({
        success: false,
        message: "Generated role code already exists",
      });
    }

    // ----------------------------------------
    // Create role
    // ----------------------------------------

    const role = await Role.create({
      roleName: formattedRoleName,
      roleCode,
      priority: priorityNum,
    });

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    console.error("Create Role Error:", error);

    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || {}
      )[0];

      return res.status(409).json({
        success: false,
        message: `${duplicateField || "Role"} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create role",
    });
  }
};

// ==========================================
// GET ALL ROLES
// ==========================================

export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({
      isActive: true,
      isBlock: false,
    })
      .select(
        "_id roleName roleCode priority isActive isBlock"
      )
      .sort({ priority: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Roles fetched successfully",
      data: roles,
    });
  } catch (error) {
    console.error("Get Roles Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
    });
  }
};

// ==========================================
// GET ROLE BY ID
// ==========================================

export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    const role = await Role.findById(id)
      .select(
        "_id roleName roleCode priority isActive isBlock"
      )
      .lean();

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Role fetched successfully",
      data: role,
    });
  } catch (error) {
    console.error("Get Role Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch role",
    });
  }
};

// ==========================================
// UPDATE ROLE
// ==========================================

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      roleName,
      priority,
      isActive,
      isBlock,
    } = req.body;

    // ----------------------------------------
    // Validate ID
    // ----------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    // ----------------------------------------
    // Find role
    // ----------------------------------------

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // ----------------------------------------
    // Update role name
    // ----------------------------------------

    if (roleName !== undefined) {
      if (
        typeof roleName !== "string" ||
        !roleName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid role name",
        });
      }

      const formattedRoleName = roleName
        .trim()
        .replace(/\s+/g, " ");

      const exists = await Role.exists({
        _id: { $ne: id },
        roleName: {
          $regex: `^${escapeRegex(formattedRoleName)}$`,
          $options: "i",
        },
      });

      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Role name already exists",
        });
      }

      role.roleName = formattedRoleName;

      // Regenerate code only if name changes
      const newRoleCode = formattedRoleName
        .replace(/\s+/g, "_")
        .toUpperCase();

      const codeExists = await Role.exists({
        _id: { $ne: id },
        roleCode: newRoleCode,
      });

      if (codeExists) {
        return res.status(409).json({
          success: false,
          message: "Generated role code already exists",
        });
      }

      role.roleCode = newRoleCode;
    }

    // ----------------------------------------
    // Update priority
    // ----------------------------------------

    if (
      priority !== undefined &&
      priority !== null &&
      priority !== ""
    ) {
      const priorityNum = Number(priority);

      if (
        !Number.isInteger(priorityNum) ||
        priorityNum < 1 ||
        priorityNum > 10
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Priority must be an integer between 1 and 10",
        });
      }

      const priorityExists = await Role.exists({
        _id: { $ne: id },
        priority: priorityNum,
      });

      if (priorityExists) {
        return res.status(409).json({
          success: false,
          message: "Priority number already exists",
        });
      }

      role.priority = priorityNum;
    }

    // ----------------------------------------
    // Status
    // ----------------------------------------

    if (typeof isActive === "boolean") {
      role.isActive = isActive;
    }

    if (typeof isBlock === "boolean") {
      role.isBlock = isBlock;
    }

    await role.save();

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: role,
    });
  } catch (error) {
    console.error("Update Role Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Role name, role code or priority already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update role",
    });
  }
};

// ==========================================
// DELETE ROLE
// ==========================================

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    const role = await Role.findById(id)
      .select("_id roleName roleCode isSystemRole priority")
      .lean();

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    if (role.isSystemRole || role.priority === 1 || role.roleCode === "OWNER") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: System Owner role cannot be deleted.",
      });
    }

    // IMPORTANT:
    // Before deleting a role, check whether users
    // are currently assigned to it.

    // Example:
    // const assignedUsers = await User.exists({
    //   role: id
    // });

    await Role.deleteOne({
      _id: id,
    });

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Delete Role Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete role",
    });
  }
};