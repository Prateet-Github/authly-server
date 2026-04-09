import { getSessions, logout, logoutAll, deleteSession } from "../controllers/session.controller.js";
import { Router } from "express";
import { protect } from "../middlewares/protect.middleware.js";

const router = Router();

router.get("/me/sessions", protect, getSessions);
router.post("/me/logout", protect, logout);
router.post("/me/logout-all", protect, logoutAll);
router.delete("/me/sessions/:sessionId", protect, deleteSession);

export default router;