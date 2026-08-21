import express from "express";
import {
    submitDailyReport,
    getMyDailyReports,
    getAllDailyReports,
    getDailyReportsByProject,
    getDailyReportById,
    deleteDailyReport
} from "../Controller/DailyReportController.js";
import { Authentication } from "../Middleware/Auth.js";

const router = express.Router();

router.use(Authentication);

router.post("/submit", submitDailyReport);
router.get("/my-reports", getMyDailyReports);
router.get("/project/:projectId", getDailyReportsByProject);
router.get("/all", getAllDailyReports);
router.get("/:id", getDailyReportById);
router.delete("/:id", deleteDailyReport);

export default router;
