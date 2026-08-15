import express from "express";
import rateLimit from "express-rate-limit";

import { registerSchema, verifyOTPSchema, loginSchema } from "../validations/auth.validation.js";
import { register, verifyOTP, login, resendOTP } from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";


const router = express.Router();
const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts. Please try again later."
});

router.post("/register", sensitiveAuthLimiter, validate(registerSchema), register);

router.post("/verify-otp", sensitiveAuthLimiter, validate(verifyOTPSchema), verifyOTP);

router.post("/resend-otp", sensitiveAuthLimiter, resendOTP);

router.post("/login", sensitiveAuthLimiter, validate(loginSchema), login);


export default router;