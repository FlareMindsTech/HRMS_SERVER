import express from "express";
import {
  createRoleMenu,
  bulkAssignRoleMenus,
  getAllRoleMenus,
  getRoleMenusByRoleId,
  getRoleMenuById,
  updateRoleMenu,
  deleteRoleMenu
} from "../Controller/RoleMenuController.js";
import { Authentication } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/create", Authentication, createRoleMenu);
router.post("/bulk-assign", Authentication, bulkAssignRoleMenus);

router.get("/", Authentication, getAllRoleMenus);
router.get("/role/:roleId", Authentication, getRoleMenusByRoleId);
router.get("/:id", Authentication, getRoleMenuById);

router.put("/:id", Authentication, updateRoleMenu);
router.delete("/:id", Authentication, deleteRoleMenu);

export default router;
