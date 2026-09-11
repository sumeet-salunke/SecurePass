import TOTP from "../models/totp.model.js";

class TOTPRepository {
  async create(data) { return await TOTP.create(data); }

  async findByIdAndVaultId(id, vaultId) { return await TOTP.findOne({ _id: id, vaultId }); }

  async listByVaultId(vaultId, { page, limit }) {
    return await TOTP.find({ vaultId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  }

  async updateByIdAndVaultId(id, vaultId, updateData) {
    return await TOTP.findOneAndUpdate({ _id: id, vaultId }, updateData, { new: true, runValidators: true });
  }

  async countByVaultId(vaultId) { return await TOTP.countDocuments({ vaultId }); }
  async deleteByIdAndVaultId(id, vaultId) { return await TOTP.findOneAndDelete({ _id: id, vaultId }); }
  async deleteByVaultId(vaultId) { return await TOTP.deleteMany({ vaultId }); }
}

export default new TOTPRepository();
