import express from "express";
import {
    createSprint,
    getProjectSprints
} from "../Controller/SprintController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/create", Authendication, createSprint);
router.get("/getByProject/:projectId", Authendication, getProjectSprints);

export default router;
