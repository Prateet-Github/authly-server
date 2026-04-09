import { Router } from "express";
import {registerUser, loginUser, refreshAccessToken, getMe} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/protect.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.get("/me", protect, getMe);

export default router;