import express from "express";
import {
    createTask,
    getTasksByProject,
    updateTaskStatus
} from "../Controller/TaskController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/create", Authendication, createTask);
router.get("/getByProject/:projectId", Authendication, getTasksByProject);
router.put("/updateStatus/:id", Authendication, updateTaskStatus);

export default router;
