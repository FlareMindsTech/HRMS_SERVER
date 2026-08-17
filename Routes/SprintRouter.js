import express from "express";
import {
    createSprint,
    getProjectSprints,
    getSprintById,
    updateSprint,
    deleteSprint
} from "../Controller/SprintController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/create", Authendication, createSprint);
router.get("/getByProject/:projectId", Authendication, getProjectSprints);

// Newly added routes
router.get("/getById/:id", Authendication, getSprintById);
router.put("/update/:id", Authendication, updateSprint);
router.delete("/delete/:id", Authendication, deleteSprint);

export default router;