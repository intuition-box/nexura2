import { Router } from "express";
import { fetchUser, updateUsername } from "@/controllers/app.controller";
import { claimQuest } from "@/controllers/tasks.controller";
import { signUp } from "@/controllers/auth.controller";
import { authenticateUser } from "@/middlewares/auth.middleware";

const router = Router();

router
	.post("/claim-quest", authenticateUser, claimQuest)
	.get("/profile", authenticateUser, fetchUser)
	.post("/sign-up", signUp)
	.patch("/update", authenticateUser, updateUsername);

export default router;