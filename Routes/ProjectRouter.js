import express from "express";
import {
    createProject,
    addProjectMember,
    getProjectDetails,
    deleteProject,
    getAllProjects,
    getMyProjects,
    updateProject,
    removeProjectMember,
} from "../Controller/ProjectController.js";
import { Authentication, requirePermission } from "../Middleware/Auth.js";

const router = express.Router();

router.use(Authentication);

// Read Projects & Details
router.get("/getAllProjects", requirePermission("project.read"), getAllProjects);
router.get("/getMyProjects", requirePermission("project.read"), getMyProjects);
router.get("/getProjectDetails/:id", requirePermission("project.read"), getProjectDetails);

// Project Mutations (RBAC Protected)
router.post("/create", requirePermission("project.create"), createProject);
router.put("/updateProject/:id", requirePermission("project.update"), updateProject);
router.delete("/deleteProject/:id", requirePermission("project.delete"), deleteProject);

// Member Management (RBAC Protected)
router.post("/addMember", requirePermission("project.add_member"), addProjectMember);
router.post("/removeMember", requirePermission("project.remove_member"), removeProjectMember);

export default router;