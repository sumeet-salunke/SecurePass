import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import authService from "../services/auth.service.js";
import cookieOptions from "../helpers/cookieOptions.js";
import clearCookieOptions from "../helpers/clearCookieOptions.js";
import { OTP_PURPOSE } from "../constants/otpPurpose.js";

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return res.status(201).json(new ApiResponse(201, result.message, result.data));
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const result = await authService.verifyOTP(req.body);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const resendOTP = asyncHandler(async (req, res) => {
  const result = await authService.resendOTP(req.body);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie(
    "refreshToken", result.refreshToken, cookieOptions
  );
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const refreshToken = asyncHandler(async (req, res) => {
  console.log("COOKIE KEYS:", Object.keys(req.cookies || {}));
  console.log("HAS REFRESH TOKEN:", Boolean(req.cookies?.refreshToken));
  const result = await authService.refreshToken(req.cookies);
  res.cookie("refreshToken",
    result.refreshToken,
    cookieOptions
  );
  return res.status(200).json(new ApiResponse(200, result.message, {
    accessToken: result.accessToken,
  }));
});