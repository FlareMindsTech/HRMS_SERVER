import express from "express";
import {
  initiateOnboarding,
  getAllOnboardings,
  updateOnboardingTask,
  completeOnboarding,
} from "../Controller/OnboardingController.js";
import { Authendication, checkMenuAccess } from "../Middleware/Auth.js";

const router = express.Router();

router.use(Authendication);

router.post("/initiate", checkMenuAccess("USER_MANAGEMENT"), initiateOnboarding);
router.get("/all", checkMenuAccess("USER_MANAGEMENT"), getAllOnboardings);
router.put("/:onboardingId/task/:taskId", checkMenuAccess("USER_MANAGEMENT"), updateOnboardingTask);
router.put("/:id/complete", checkMenuAccess("USER_MANAGEMENT"), completeOnboarding);

export default router;
