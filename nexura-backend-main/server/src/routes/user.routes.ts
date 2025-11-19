import { Router } from "express";
import { fetchUser, updateUsername } from "@/controllers/app.controller";
import { claimDailyQuest, claimOneTimeQuest } from "@/controllers/tasks.controller";
import { signUp } from "@/controllers/auth.controller";
import { authenticateUser } from "@/middlewares/auth.middleware";

const router = Router();

router
	.post("/claim-daily-quest", authenticateUser, claimDailyQuest)
	.post("/claim-one-time-quest", authenticateUser, claimOneTimeQuest)
	.get("/profile", authenticateUser, fetchUser)
	.post("/sign-up", signUp)
	.patch("/update", authenticateUser, updateUsername);

export default router;