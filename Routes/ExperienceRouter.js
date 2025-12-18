import express from 'express';
import { addExperience, deleteExperience, updateExperience, getExperienceByUserId} from '../Controller/ExperienceController.js';


const router = express.Router();

router.post("/add", addExperience);
router.get("/get/:userId", getExperienceByUserId);
router.put("/update", updateExperience);
router.delete("/delete/:id", deleteExperience);

export default router;
