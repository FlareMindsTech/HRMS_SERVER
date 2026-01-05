import express from "express";
import {
  createEducation,
  getEducationByUser,
  updateEducation,
  deleteEducation,
  getAllEducation
} from "../Controller/EducationController.js";

const router = express.Router();

// ===== CREATE EDUCATION =====
router.post("/", createEducation);

// ===== GET EDUCATION BY USER ID =====
router.get("/:userId", getEducationByUser);

// ===== UPDATE EDUCATION BY USER ID =====
router.put("/:userId", updateEducation);

// ===== DELETE EDUCATION BY USER ID =====
router.delete("/:userId", deleteEducation);

// ===== GET ALL EDUCATION RECORDS =====
router.get("/", getAllEducation);

export default router;
