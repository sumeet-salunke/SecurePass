import Credential from "../models/credential.model.js";

class CredentialRepository {
  async create(data) {
    return await Credential.create(data);
  }

  async findByIdAndVaultId(id, vaultId) {
    return await Credential.findOne({ _id: id, vaultId });
  }

  async findByVaultId(vaultId) {
    return await Credential.find({ vaultId }).sort({ createdAt: -1 });
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
