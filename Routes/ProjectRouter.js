import express from "express";
import {
    createProject,
    addProjectMember,
    getProjectDetails,
    deleteProject
} from "../Controller/ProjectController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/create", Authendication, createProject);
router.post("/addMember", Authendication, addProjectMember);
router.get("/getProjectDetails/:id", Authendication, getProjectDetails);
router.delete("/deleteProject/:id", Authendication, deleteProject);

export default router;
