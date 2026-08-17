import express from "express";
import {
    createTask,
    getTasksByProject,
    updateTaskStatus,
    getMyTasks,
    getTaskById,
    updateTask,
    deleteTask
} from "../Controller/TaskController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/create", Authendication, createTask);
router.get("/getByProject/:projectId", Authendication, getTasksByProject);
router.put("/updateStatus/:id", Authendication, updateTaskStatus);

// Newly added routes
router.get("/getMyTasks", Authendication, getMyTasks);
router.get("/getById/:id", Authendication, getTaskById);
router.put("/update/:id", Authendication, updateTask);
router.delete("/delete/:id", Authendication, deleteTask);

export default router;