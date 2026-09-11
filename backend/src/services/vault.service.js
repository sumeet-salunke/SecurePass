import vaultRepository from "../repositories/vault.repository.js";
import credentialRepository from "../repositories/credential.repository.js";
import secureNoteRepository from "../repositories/secureNote.repository.js";
import totpRepository from "../repositories/totp.repository.js";
import ApiError from "../utils/ApiError.js";
import { AUTH_MESSAGES } from "../constants/messages.js";

const publicVault = (vault) => ({
  id: vault._id,
  vaultSalt: vault.vaultSalt.toString("base64"),
  encryptedVaultKey: vault.encryptedVaultKey.toString("base64"),
  vaultKeyIv: vault.vaultKeyIv.toString("base64"),
  vaultKeyAuthTag: vault.vaultKeyAuthTag.toString("base64"),
  createdAt: vault.createdAt,
  updatedAt: vault.updatedAt,
});

class VaultService {
  async createVault(userId, vaultData) {
    if (!userId) throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    if (await vaultRepository.existsByUserId(userId)) {
      throw new ApiError(409, "Vault already exists.");
    }
    try {
      const vault = await vaultRepository.create({ userId, ...vaultData });
      return publicVault(vault);
    } catch (error) {
      if (error?.code === 11000) throw new ApiError(409, "Vault already exists.");
      throw error;
    }
  }

  async getVault(userId) {
    const vault = await vaultRepository.findByUserId(userId);
    if (!vault) throw new ApiError(404, "Vault not found.");
    return publicVault(vault);
  }

  async getStats(userId) {
    const vault = await vaultRepository.findByUserId(userId);
    if (!vault) throw new ApiError(404, "Vault not found.");

    const [
      credentials,
      favoriteCredentials,
      secureNotes,
      favoriteSecureNotes,
      totp,
    ] = await Promise.all([
      credentialRepository.countByVaultId(vault._id),
      credentialRepository.countFavoritesByVaultId(vault._id),
      secureNoteRepository.countByVaultId(vault._id),
      secureNoteRepository.countFavoritesByVaultId(vault._id),
      totpRepository.countByVaultId(vault._id),
    ]);

    return {
      credentials: { total: credentials, favorites: favoriteCredentials },
      secureNotes: { total: secureNotes, favorites: favoriteSecureNotes },
      totp: { total: totp },
      updatedAt: vault.updatedAt,
    };
  }

  async deleteVault(userId) {
    const vault = await vaultRepository.findByUserId(userId);
    if (!vault) throw new ApiError(404, "Vault not found.");
    await credentialRepository.deleteByVaultId(vault._id);
    await secureNoteRepository.deleteByVaultId(vault._id);
    await totpRepository.deleteByVaultId(vault._id);
    await vaultRepository.deleteByUserId(userId);
    return null;
  }
}
export { publicVault };
export default new VaultService();
