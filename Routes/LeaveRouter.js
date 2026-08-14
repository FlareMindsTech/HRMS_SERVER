import express from "express";
import {
  applyLeave,
  getAllLeaves,
  getLeavesByEmployee,
  getLeaveById,
  updateLeaveStatus,
  cancelLeave,
  deleteLeave
} from "../Controller/LeaveController.js";
import { Authentication, checkMenuAccess } from "../Middleware/Auth.js";

const router = express.Router();

router.use(Authentication);

// Employee self leave management
router.post("/apply", applyLeave);
router.get("/employee/:employeeId", getLeavesByEmployee);
router.get("/:id", getLeaveById);
router.put("/cancel/:id", cancelLeave);

// Leave administration (Requires LEAVE_MGMT menu permission mapping)
router.get("/all", checkMenuAccess("LEAVE_MGMT"), getAllLeaves);
router.put("/status/:id", checkMenuAccess("LEAVE_MGMT"), updateLeaveStatus);
router.delete("/:id", checkMenuAccess("LEAVE_MGMT"), deleteLeave);

export default router;
