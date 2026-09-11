import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import vaultRepository from "../repositories/vault.repository.js";
import totpRepository from "../repositories/totp.repository.js";

const toBuffer = (value) => Buffer.from(value, "base64");
const validateId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid TOTP ID.");
};
const publicTOTP = (item) => ({
  id: item._id,
  encryptedData: item.encryptedData.toString("base64"),
  iv: item.iv.toString("base64"),
  authTag: item.authTag.toString("base64"),
  algorithm: item.algorithm,
  digits: item.digits,
  period: item.period,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

class TOTPService {
  async ownedVault(userId) {
    const vault = await vaultRepository.findByUserId(userId);
    if (!vault) throw new ApiError(404, "Vault not found.");
    return vault;
  }

  async create(userId, data) {
    const vault = await this.ownedVault(userId);
    return publicTOTP(await totpRepository.create({
      vaultId: vault._id, encryptedData: toBuffer(data.encryptedData), iv: toBuffer(data.iv),
      authTag: toBuffer(data.authTag), algorithm: data.algorithm, digits: data.digits, period: data.period,
    }));
  }

  async get(userId, id) {
    validateId(id);
    const vault = await this.ownedVault(userId);
    const item = await totpRepository.findByIdAndVaultId(id, vault._id);
    if (!item) throw new ApiError(404, "TOTP record not found.");
    return publicTOTP(item);
  }

  async list(userId, options) {
    const vault = await this.ownedVault(userId);
    const items = await totpRepository.listByVaultId(vault._id, options);
    return { items: items.map(publicTOTP), page: options.page, limit: options.limit, hasMore: items.length === options.limit };
  }

  async update(userId, id, data) {
    validateId(id);
    const vault = await this.ownedVault(userId);
    const update = {};
    if (data.encryptedData !== undefined) update.encryptedData = toBuffer(data.encryptedData);
    if (data.iv !== undefined) update.iv = toBuffer(data.iv);
    if (data.authTag !== undefined) update.authTag = toBuffer(data.authTag);
    if (data.algorithm !== undefined) update.algorithm = data.algorithm;
    if (data.digits !== undefined) update.digits = data.digits;
    if (data.period !== undefined) update.period = data.period;
    const item = await totpRepository.updateByIdAndVaultId(id, vault._id, update);
    if (!item) throw new ApiError(404, "TOTP record not found.");
    return publicTOTP(item);
  }

  async delete(userId, id) {
    validateId(id);
    const vault = await this.ownedVault(userId);
    const item = await totpRepository.deleteByIdAndVaultId(id, vault._id);
    if (!item) throw new ApiError(404, "TOTP record not found.");
    return null;
  }
}

export default new TOTPService();
