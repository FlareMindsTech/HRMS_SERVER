import RoleMenu from "../Modules/RoleMenuModule.js";
import Role from "../Modules/RoleModules.js";
import Menu from "../Modules/MenuModule.js";
import mongoose from "mongoose";

// CREATE
export const createRoleMenu = async (req, res) => {
  try {
    const { roleId, menuId } = req.body;

    if (!roleId || !menuId) {
      return res.status(400).json({ message: "roleId & menuId required" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(roleId) ||
      !mongoose.Types.ObjectId.isValid(menuId)
    ) {
      return res.status(400).json({ message: "Invalid roleId or menuId" });
    }

    const role = await Role.findById(roleId);
    const menu = await Menu.findById(menuId);

    if (!role || !menu) {
      return res.status(404).json({ message: "Role or Menu not found" });
    }

    const data = await RoleMenu.create({ roleId, menuId });

    res.status(201).json({
      success: true,
      message: "RoleMenu mapped successfully",
      data
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "This role is already mapped to this menu"
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// GET ALL
export const getAllRoleMenus = async (req, res) => {
  try {
    const data = await RoleMenu.find()
      .populate("roleId")
      .populate("menuId");

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET BY ID
export const getRoleMenuById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid RoleMenu ID" });
    }

    const data = await RoleMenu.findById(id)
      .populate("roleId")
      .populate("menuId");

    if (!data) {
      return res.status(404).json({ message: "RoleMenu mapping not found" });
    }

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE (change role or menu)
export const updateRoleMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId, menuId } = req.body;

    if (!roleId || !menuId) {
      return res.status(400).json({
        message: "roleId & menuId required"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(roleId) ||
      !mongoose.Types.ObjectId.isValid(menuId)
    ) {
      return res.status(400).json({ message: "Invalid ID(s)" });
    }

    // 🔴 IMPORTANT CHECK (exclude current document)
    const existingMapping = await RoleMenu.findOne({
      roleId,
      menuId,
      _id: { $ne: id }   // <-- THIS IS THE KEY
    });

    if (existingMapping) {
      return res.status(400).json({
        message: "This role is already mapped to this menu"
      });
    }

    const data = await RoleMenu.findByIdAndUpdate(
      id,
      { roleId, menuId },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({ message: "Mapping not found" });
    }

    res.status(200).json({
      success: true,
      message: "RoleMenu updated successfully",
      data
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE (hard delete)
export const deleteRoleMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await RoleMenu.findByIdAndDelete(id);

    if (!data) {
      return res.status(404).json({ message: "Mapping not found" });
    }

    res.status(200).json({
      success: true,
      message: "RoleMenu deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
