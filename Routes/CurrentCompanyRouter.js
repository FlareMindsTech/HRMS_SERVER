import express from "express";
import {
  createCurrentCompany,
  getCurrentCompanyByUserId,
  updateCurrentCompany,
  deleteCurrentCompany,
  getAllCurrentCompanies
} from "../Controller/CurrentCompanyController.js";

const router = express.Router();

router.post("/", createCurrentCompany);
router.get("/", getAllCurrentCompanies);
router.get("/:userId", getCurrentCompanyByUserId);
router.put("/:userId", updateCurrentCompany);
router.delete("/:userId", deleteCurrentCompany);

export default router;
