import { Router } from "express";
import { projectSignUp } from "@/controllers/auth.controller";

const router = Router();

router
  .post("/sign-up", projectSignUp)
  // .post("/sign-in");

export default router;