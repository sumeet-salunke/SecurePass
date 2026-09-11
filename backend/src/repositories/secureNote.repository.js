import SecureNote from "../models/secureNote.model.js";

class SecureNoteRepository {
  async create(data) { return await SecureNote.create(data); }

  async findByIdAndVaultId(id, vaultId) {
    return await SecureNote.findOne({ _id: id, vaultId });
  }

  async listByVaultId(vaultId, { page, limit, favorite }) {
    const filter = { vaultId };
    if (favorite !== undefined) filter.favorite = favorite;
    return await SecureNote.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  }

  async updateByIdAndVaultId(id, vaultId, updateData) {
    return await SecureNote.findOneAndUpdate({ _id: id, vaultId }, updateData, { new: true, runValidators: true });
  }

  async countByVaultId(vaultId) { return await SecureNote.countDocuments({ vaultId }); }
  async countFavoritesByVaultId(vaultId) { return await SecureNote.countDocuments({ vaultId, favorite: true }); }
  async deleteByIdAndVaultId(id, vaultId) { return await SecureNote.findOneAndDelete({ _id: id, vaultId }); }
  async deleteByVaultId(vaultId) { return await SecureNote.deleteMany({ vaultId }); }
}

export default new SecureNoteRepository();
