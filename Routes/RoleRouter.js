import express from "express";
import {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole
} from "../Controller/RoleController.js";

const router = express.Router();

router.post("/createRole", createRole);

router.get("/getAllRoles", getAllRoles);

router.get("/getById/:id", getRoleById);

router.put("/updateRole/:id", updateRole);

router.delete("/deleteRole/:id", deleteRole);

export default router;
