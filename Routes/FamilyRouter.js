import express from "express";
import { createFamilyMember, deleteFamilyMember, getAllFamilyMembers, getFamilyByUserId, updateFamilyMember } from "../Controller/FamilyController.js";

const router = express.Router();

router.post("/add", createFamilyMember);
router.get("/get/:userid", getFamilyByUserId);
router.get("/getAll", getAllFamilyMembers); 
router.put("/update", updateFamilyMember);
router.delete("/delete", deleteFamilyMember);

export default router;
