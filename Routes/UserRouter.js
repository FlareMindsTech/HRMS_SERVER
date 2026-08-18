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
  provisionAccount,
  updateAccountStatus,
  resetAccountCredentials,
} from "../Controller/UserController.js";
import {
  Authentication,
  isAdmin,
  requirePermission,
  requireOwnershipOrPermission,
} from "../Middleware/Auth.js";

const router = express.Router();

// ── Public Routes ──
router.post("/register-owner", registerOwner);
router.post("/login", login);
router.post("/v2/reg", Register);

// ── Authenticated Self / Session Routes ──
router.post("/logout", Authentication, logout);
router.get("/profile", Authentication, profile);
router.put("/v2/update", Authentication, updateUser);

// ── User Management & Directory (RBAC Protected) ──
router.get("/get", Authentication, requirePermission("user.read"), getAllUser);
router.get(
  "/v2/getbyid/:id",
  Authentication,
  requireOwnershipOrPermission("id", "user.read_own", "user.read"),
  getUserById
);

// ── Account Provisioning & Lifecycle Management ──
router.post(
  "/provision-account",
  Authentication,
  requirePermission("user.provision_account"),
  provisionAccount
);
router.put(
  "/account-status/:id",
  Authentication,
  requirePermission("user.manage_status"),
  updateAccountStatus
);
router.put(
  "/reset-credentials/:id",
  Authentication,
  requirePermission("user.manage_status"),
  resetAccountCredentials
);

// ── Role Assignment & User Deletion ──
router.put(
  "/v2/updateRole/:id",
  Authentication,
  requirePermission("user.manage_roles"),
  updateUserRole
);
router.delete(
  "/v2/deleteUser/:id",
  Authentication,
  isAdmin,
  deleteUser
);
router.delete(
  "/v2/deleteUser",
  Authentication,
  isAdmin,
  deleteUser
);

export default router;