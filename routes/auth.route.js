import { Router } from "express";
import { registerUser, loginUser, verifyEmail, refreshAccessToken } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/verify-email",verifyEmail);
router.post("/refresh",refreshAccessToken);

export default router;