import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import credentialService from "../services/credential.service.js";

export const createCredential = asyncHandler(async (req, res) => {
  const data = await credentialService.createCredential(req.user.id, req.body);
  return res.status(201).json(new ApiResponse(201, "Credential created successfully.", data));
});

export const getCredential = asyncHandler(async (req, res) => {
  const data = await credentialService.getCredential(req.user.id, req.params.credentialId);
  return res.status(200).json(new ApiResponse(200, "Credential fetched successfully.", data));
});

export const listCredentials = asyncHandler(async (req, res) => {
  const data = await credentialService.listCredentials(req.user.id, req.query);
  return res.status(200).json(new ApiResponse(200, "Credentials fetched successfully.", data));
});

export const updateCredential = asyncHandler(async (req, res) => {
  const data = await credentialService.updateCredential(req.user.id, req.params.credentialId, req.body);
  return res.status(200).json(new ApiResponse(200, "Credential updated successfully.", data));
});

export const deleteCredential = asyncHandler(async (req, res) => {
  await credentialService.deleteCredential(req.user.id, req.params.credentialId);
  return res.status(200).json(new ApiResponse(200, "Credential deleted successfully.", null));
});
