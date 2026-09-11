import Vault from "../models/vault.model.js";

class VaultRepository {
  async create(vaultData) {
    const vault = await Vault.create(vaultData);
    return vault;
  }
  async findByUserId(userId) {
    return await Vault.findOne({ userId });
  }
  async deleteByUserId(userId) {
    return await Vault.findOneAndDelete({ userId });
  }

  async existsByUserId(userId) {
    return await Vault.exists({ userId });
  }
};

export default new VaultRepository();
