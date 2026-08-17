import express from "express";
import {
    createProject,
    addProjectMember,
    getProjectDetails,
    deleteProject,
    getAllProjects,
    getMyProjects,
    updateProject,
    removeProjectMember
} from "../Controller/ProjectController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/create", Authendication, createProject);
router.post("/addMember", Authendication, addProjectMember);
router.get("/getProjectDetails/:id", Authendication, getProjectDetails);
router.delete("/deleteProject/:id", Authendication, deleteProject);

// Newly added routes
router.get("/getAllProjects", Authendication, getAllProjects);
router.get("/getMyProjects", Authendication, getMyProjects);
router.put("/updateProject/:id", Authendication, updateProject);
router.post("/removeMember", Authendication, removeProjectMember);

export default router;