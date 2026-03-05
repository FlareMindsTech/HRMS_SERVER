import express from "express";
import {
    addTimeTracking,
    getTimeTracksByTask
} from "../Controller/TimeTrackingController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/add", Authendication, addTimeTracking);
router.get("/getByTask/:taskId", Authendication, getTimeTracksByTask);

export default router;
