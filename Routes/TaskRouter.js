import express from "express";
import {
    createTask,
    getTasksByProject,
    getTasksBySprint,
    updateTaskStatus,
    reassignTask,
    getMyTasks,
    getTaskById,
    updateTask,
    deleteTask
} from "../Controller/TaskController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.use(Authendication);

// Task Assignment & Tracking Routes
router.post("/create", createTask);
router.get("/myTasks", getMyTasks);
router.put("/:id/status", updateTaskStatus);
router.put("/:id/assign", reassignTask);
router.get("/project/:projectId", getTasksByProject);
router.get("/sprint/:sprintId", getTasksBySprint);

// Legacy/Helper Routes
router.get("/getByProject/:projectId", getTasksByProject);
router.put("/updateStatus/:id", updateTaskStatus);
router.get("/getById/:id", getTaskById);
router.put("/update/:id", updateTask);
router.delete("/delete/:id", deleteTask);

export default router;