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
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.use(Authendication);

router.post("/apply", applyLeave);
router.get("/all", getAllLeaves);
router.get("/employee/:employeeId", getLeavesByEmployee);
router.get("/:id", getLeaveById);
router.put("/status/:id", updateLeaveStatus);
router.put("/cancel/:id", cancelLeave);
router.delete("/:id", deleteLeave);

export default router;
