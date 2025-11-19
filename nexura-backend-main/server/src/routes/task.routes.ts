import { Router } from "express";
import {
	claimEcosystemTask,
	performCampaignTask,
	setTimer,
	submitTask,
} from "@/controllers/tasks.controller";
import { authenticateUser } from "@/middlewares/auth.middleware";

const router = Router();

router
  .post("/claim-ecosystem-task", authenticateUser, claimEcosystemTask)
  .post("/eco-timer", authenticateUser, setTimer)
	.post("/perform-campaign-task", authenticateUser, performCampaignTask)
	.post("/submit-task", authenticateUser, submitTask);

export default router;
