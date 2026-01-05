import express from "express";
import {
  createRoleMenu,
  getAllRoleMenus,
 getRoleMenuById,
  updateRoleMenu,
  deleteRoleMenu
} from "../Controller/RoleMenuController.js";
import { Authendication } from "../Middleware/Auth.js";
const router = express.Router();

router.post("/create", createRoleMenu);
router.get("/", getAllRoleMenus);
router.get("/role/:id", getRoleMenuById);
router.put("/:id", updateRoleMenu);
router.delete("/:id", deleteRoleMenu);

export default router;
