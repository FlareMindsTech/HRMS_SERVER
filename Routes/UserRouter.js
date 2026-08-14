import express from "express";
import {
  deleteUser,
  getAllUser,
  getUserById,
  login,
  logout,
  profile,
  Register,
  registerOwner,
  updateUser,
  updateUserRole,
} from "../Controller/UserController.js";
import { Authendication as Authentication } from "../Middleware/Auth.js";

const router = express.Router();

// Public routes
router.post("/register-owner", registerOwner);
router.post("/login", login);
router.post("/v2/reg", Register);

// Protected routes
router.post("/logout", Authentication, logout);
router.get("/profile", Authentication, profile);
router.get("/get", Authentication, getAllUser);
router.get("/v2/getbyid/:id", Authentication, getUserById);
router.put("/v2/update", Authentication, updateUser);
router.put("/v2/updateRole/:id", Authentication, updateUserRole);
router.delete("/v2/deleteUser/:id", Authentication, deleteUser);
router.delete("/v2/deleteUser", Authentication, deleteUser);

export default router;