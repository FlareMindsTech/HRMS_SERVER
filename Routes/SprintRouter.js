import express from "express";
import {
    createSprint,
    getProjectSprints,
    getSprintById,
    updateSprint,
    updateSprintStatus,
    getSprintTasks,
    deleteSprint
} from "../Controller/SprintController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.use(Authendication);

// Sprint Management Routes
router.post("/create", createSprint);
router.put("/:id/status", updateSprintStatus);
router.get("/project/:projectId", getProjectSprints);
router.get("/:sprintId/tasks", getSprintTasks);

// Legacy/Helper Routes
router.get("/getByProject/:projectId", getProjectSprints);
router.get("/getById/:id", getSprintById);
router.put("/update/:id", updateSprint);
router.delete("/delete/:id", deleteSprint);

export default router;