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
  const result = await authService.refreshToken(req.cookies);
  res.cookie("refreshToken",
    result.refreshToken,
    cookieOptions
  );
  return res.status(200).json(new ApiResponse(200, result.message, {
    accessToken: result.accessToken,
  }));
});

export const getSessions = asyncHandler(async (req, res) => {
  const result = await authService.getSessions(req.user.id);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const revokeSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const familyId = req.params.sessionId;
  const result = await authService.revokeSession(userId, familyId);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const revokeAllSessions = asyncHandler(async (req, res) => {
  const result = await authService.revokeAllSessions(req.user.id);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.cookies);
  res.clearCookie("refreshToken", clearCookieOptions);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));

});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const setupMFA = asyncHandler(async (req, res) => {
  const result = await authService.setupMFA(req.user.id);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const verifyMFACode = asyncHandler(async (req, res) => {
  const result = await authService.verifyMFASetup(req.user.id, req.body.code);
  return res.status(200).json(new ApiResponse(200, result.message, result.data))
});

export const verifyMFALogin = asyncHandler(async (req, res) => {
  const result = await authService.verifyMFALogin(req.body);
  //store the refresh token in the same secure cookie used by normal login
  res.cookie("refreshToken", result.refreshToken, cookieOptions);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const disableMFA = asyncHandler(async (req, res) => {
  const result = await authService.disableMFA(req.user.id, req.body);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const verifyRecoveryCodeLogin = asyncHandler(async (req, res) => {
  const result = await authService.verifyRecoveryCodeLogin(req.body);
  res.cookie("refreshToken", result.refreshToken, cookieOptions);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const regenerateRecoveryCodes = asyncHandler(async (req, res) => {
  const result = await authService.regenerateRecoveryCodes(req.user.id, req.body);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const changeEmail = asyncHandler(async (req, res) => {
  const result = await authService.changeEmail(req.user.id, req.body);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const verifyEmailChange = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmailChange(req.user.id, req.body);
  return res.status(200).json(new ApiResponse(200, result.message, result.data));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const result = await authService.deleteAccount(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, result.message, result.data));
});