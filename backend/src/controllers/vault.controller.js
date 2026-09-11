import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import vaultService from "../services/vault.service.js";

export const createVault = asyncHandler(async (req, res) => {
  const data = await vaultService.createVault(req.user.id, {
    vaultSalt: Buffer.from(req.body.vaultSalt, "base64"),
    encryptedVaultKey: Buffer.from(req.body.encryptedVaultKey, "base64"),
    vaultKeyIv: Buffer.from(req.body.vaultKeyIv, "base64"),
    vaultKeyAuthTag: Buffer.from(req.body.vaultKeyAuthTag, "base64"),
  });
  return res.status(201).json(new ApiResponse(201, "Vault created successfully.", data));
});

export const getVault = asyncHandler(async (req, res) => {
  const data = await vaultService.getVault(req.user.id);
  return res.status(200).json(new ApiResponse(200, "Vault fetched successfully.", data));
});

export const deleteVault = asyncHandler(async (req, res) => {
  await vaultService.deleteVault(req.user.id);
  return res.status(200).json(new ApiResponse(200, "Vault deleted successfully.", null));
});
