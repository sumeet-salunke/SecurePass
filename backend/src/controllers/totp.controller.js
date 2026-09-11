import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import totpService from "../services/totp.service.js";

export const createTOTP = asyncHandler(async (req, res) => res.status(201).json(new ApiResponse(201, "TOTP record created successfully.", await totpService.create(req.user.id, req.body))));
export const getTOTP = asyncHandler(async (req, res) => res.status(200).json(new ApiResponse(200, "TOTP record fetched successfully.", await totpService.get(req.user.id, req.params.totpId))));
export const listTOTP = asyncHandler(async (req, res) => res.status(200).json(new ApiResponse(200, "TOTP records fetched successfully.", await totpService.list(req.user.id, req.query))));
export const updateTOTP = asyncHandler(async (req, res) => res.status(200).json(new ApiResponse(200, "TOTP record updated successfully.", await totpService.update(req.user.id, req.params.totpId, req.body))));
export const deleteTOTP = asyncHandler(async (req, res) => { await totpService.delete(req.user.id, req.params.totpId); return res.status(200).json(new ApiResponse(200, "TOTP record deleted successfully.", null)); });
