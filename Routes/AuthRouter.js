import express from "express";
import { registerOwner, login } from "../Controller/UserController.js";

const router = express.Router();

// One-time Initial Owner Registration Endpoint (Secured by X-HRMS-Setup-Key header)
router.post("/register-owner", registerOwner);

// Standard Login Endpoint
router.post("/login", login);

export default router;
