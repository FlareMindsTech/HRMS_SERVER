import express from "express";
import {
    submitDailyReport,
    getMyDailyReports,
    getAllDailyReports,
    getDailyReportById,
    deleteDailyReport
} from "../Controller/DailyReportController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.use(Authendication);

router.post("/submit", submitDailyReport);
router.get("/my-reports", getMyDailyReports);
router.get("/all", getAllDailyReports);
router.get("/:id", getDailyReportById);
router.delete("/:id", deleteDailyReport);

export default router;
