import { Router } from "express";
import { registerUser, loginUser, verifyEmail } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/verify-email",verifyEmail);

export default router;