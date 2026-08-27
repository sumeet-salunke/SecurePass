import express from "express";
import rateLimit from "express-rate-limit";

import { registerSchema, verifyOTPSchema, loginSchema } from "../validations/auth.validation.js";
import { register, verifyOTP, login, resendOTP, refreshToken, getSessions, revokeSession, revokeAllSessions, logout, changePassword } from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts. Please try again later."
});

router.delete("/sessions", authenticate, revokeAllSessions);
router.delete("/sessions/:sessionId", authenticate, revokeSession);

router.post("/register", sensitiveAuthLimiter, validate(registerSchema), register);

router.post("/verify-otp", sensitiveAuthLimiter, validate(verifyOTPSchema), verifyOTP);

router.post("/resend-otp", sensitiveAuthLimiter, resendOTP);

router.post("/login", sensitiveAuthLimiter, validate(loginSchema), login);

router.patch("/change-password", authenticate, changePassword);

router.post("/refresh", refreshToken);

router.post("/logout", logout);

router.get("/sessions", authenticate, getSessions);

export default router;