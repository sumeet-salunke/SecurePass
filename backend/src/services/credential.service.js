import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import { AUTH_MESSAGES } from "../constants/messages.js";
import vaultRepository from "../repositories/vault.repository.js";
import credentialRepository from "../repositories/credential.repository.js";

const validateId = (id, message = "Invalid identifier.") => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, message);
};

const toBuffer = (value) => Buffer.from(value, "base64");
const publicCredential = (credential) => ({
  id: credential._id,
  encryptedData: credential.encryptedData.toString("base64"),
  iv: credential.iv.toString("base64"),
  authTag: credential.authTag.toString("base64"),
  createdAt: credential.createdAt,
  updatedAt: credential.updatedAt,
});

class CredentialService {
  async getOwnedVault(userId) {
    const vault = await vaultRepository.findByUserId(userId);
    if (!vault) throw new ApiError(404, "Vault not found.");
    return vault;
  }

  async createCredential(userId, data) {
    const vault = await this.getOwnedVault(userId);
    const credential = await credentialRepository.create({
      vaultId: vault._id,
      encryptedData: toBuffer(data.encryptedData),
      iv: toBuffer(data.iv),
      authTag: toBuffer(data.authTag),
    });
    return publicCredential(credential);
  }

  async getCredential(userId, credentialId) {
    validateId(credentialId, "Invalid credential ID.");
    const vault = await this.getOwnedVault(userId);
    const credential = await credentialRepository.findByIdAndVaultId(credentialId, vault._id);
    if (!credential) throw new ApiError(404, "Credential not found.");
    return publicCredential(credential);
  }

  async listCredentials(userId) {
    const vault = await this.getOwnedVault(userId);
    const credentials = await credentialRepository.findByVaultId(vault._id);
    return credentials.map(publicCredential);
  }

  async updateCredential(userId, credentialId, data) {
    validateId(credentialId, "Invalid credential ID.");
    const vault = await this.getOwnedVault(userId);
    const credential = await credentialRepository.updateByIdAndVaultId(credentialId, vault._id, {
      encryptedData: toBuffer(data.encryptedData),
      iv: toBuffer(data.iv),
      authTag: toBuffer(data.authTag),
    });
    if (!credential) throw new ApiError(404, "Credential not found.");
    return publicCredential(credential);
  }

  async deleteCredential(userId, credentialId) {
    validateId(credentialId, "Invalid credential ID.");
    const vault = await this.getOwnedVault(userId);
    const credential = await credentialRepository.deleteByIdAndVaultId(credentialId, vault._id);
    if (!credential) throw new ApiError(404, "Credential not found.");
    return null;
  }
}

export default new CredentialService();
