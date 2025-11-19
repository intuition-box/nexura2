import { Router } from "express";
import { addCampaignAddress, claimCampaignRewards, closeCampaign, createCampaign, joinCampaign, updateCampaign } from "@/controllers/campaign.controller";
import { createCampaignTasks, createEcosystemTasks, fetchCampaignTasks } from "@/controllers/tasks.controller";
import { authenticateProject, authenticateUser } from "@/middlewares/auth.middleware";

const router = Router();

router
	.patch("/add-campaign-address", authenticateProject, addCampaignAddress)
	.post("/complete-campaign", authenticateProject, claimCampaignRewards)
	.patch("/close-campaign", authenticateProject, closeCampaign)
	.post("/create-campaign", authenticateProject, createCampaign)
	.post("/create-campaign-tasks", authenticateProject, createCampaignTasks)
	.post("/create-ecosystem-tasks", authenticateProject, createEcosystemTasks)
	.post("/join-campaign", authenticateUser, joinCampaign)
	.get("/tasks", fetchCampaignTasks)
	.patch("/update-campaign", authenticateProject, updateCampaign);
  

export default router;