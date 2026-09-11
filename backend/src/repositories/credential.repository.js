import Credential from "../models/credential.model.js";

class CredentialRepository {
  async create(data) {
    return await Credential.create(data);
  }

  async findByIdAndVaultId(id, vaultId) {
    return await Credential.findOne({ _id: id, vaultId });
  }

  async findByVaultId(vaultId, { page, limit, favorite } = {}) {
    const filter = { vaultId };
    if (favorite !== undefined) filter.favorite = favorite;
    let query = Credential.find(filter).sort({ createdAt: -1 });
    if (page && limit) query = query.skip((page - 1) * limit).limit(limit);
    return await query;
  }

  async countByVaultId(vaultId) {
    return await Credential.countDocuments({ vaultId });
  }

  async countFavoritesByVaultId(vaultId) {
    return await Credential.countDocuments({ vaultId, favorite: true });
  }

  async updateByIdAndVaultId(id, vaultId, updateData) {
    return await Credential.findOneAndUpdate(
      { _id: id, vaultId }, updateData, { new: true, runValidators: true }
    );
  }

  async deleteByIdAndVaultId(id, vaultId) {
    return await Credential.findOneAndDelete({ _id: id, vaultId });
  }

  async deleteByVaultId(vaultId) {
    return await Credential.deleteMany({ vaultId });
  }
}

export default new CredentialRepository();
