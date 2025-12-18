import { Router } from "express";
import { registerUser, loginUser, verifyEmail, refreshAccessToken, getSessions, logout, logoutAll } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/protect.middleware.js";

const router = Router();

router.post("/register",registerUser);
router.post("/login",loginUser);

router.get("/verify-email",verifyEmail);

router.post("/refresh",refreshAccessToken);
router.get("/sessions",protect,getSessions);

router.post("/logout",logout);
router.post("/logout-all",protect,logoutAll);

export default router;