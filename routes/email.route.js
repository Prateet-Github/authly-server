import { verifyEmail } from "../controllers/email.controller.js";
import { Router } from "express";

const router = Router();

router.get("/verify-email", verifyEmail);

export default router;