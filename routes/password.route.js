import { requestPasswordReset, confirmPasswordReset } from "../controllers/password.controller.js";
import { Router } from "express";

const router = Router();

router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/confirm", confirmPasswordReset);

export default router;