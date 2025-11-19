import { Router } from "express";
import { home } from "@/controllers/app.controller";
import { fetchCampaigns } from "@/controllers/campaign.controller";
import adminRoutes from "./admin.routes.ts";
import campaignRoutes from "./campaign.routes.ts";
import projectRoutes from "./project.routes.ts";
import taskRoutes from "./task.routes.ts";
import userRoutes from "./user.routes.ts";
import { fetchEcosystemDapps, fetchQuests } from "@/controllers/tasks.controller.ts";

const router = Router();

router
  .get("/", home)
  .use("/admin", adminRoutes)
  .get("/ecosystem-tasks", fetchEcosystemDapps)
  .get("/quests", fetchQuests)
  .get("/campaigns", fetchCampaigns)
  .use("/campaign", campaignRoutes)
  .use("/project", projectRoutes)
  .use("/task", taskRoutes)
  .use("/user", userRoutes);

export default router;