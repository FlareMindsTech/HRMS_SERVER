import express from "express";

import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../Controller/RoleController.js";

import {
  Authentication,
  isAdmin
} from "../Middleware/Auth.js";

const router = express.Router();

// Admin only (Priority <= 2)
router.post("/", Authentication, isAdmin, createRole);
router.put("/:id", Authentication, isAdmin, updateRole);
router.delete("/:id", Authentication, isAdmin, deleteRole);

// Authenticated users
router.get("/", Authentication, getAllRoles);
router.get("/:id", Authentication, getRoleById);

export default router;