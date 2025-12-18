import { Router } from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  refreshAccessToken,
  getSessions,
  logout,
  logoutAll,
  getMe,
  deleteSession
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/protect.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);

router.get("/verify-email", verifyEmail);

router.get("/me", protect, getMe);
router.get("/me/sessions", protect, getSessions);
router.post("/me/logout", protect, logout);
router.post("/me/logout-all", protect, logoutAll);
router.delete("/me/sessions/:sessionId", protect, deleteSession);

export default router;