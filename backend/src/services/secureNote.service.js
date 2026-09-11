import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import vaultRepository from "../repositories/vault.repository.js";
import secureNoteRepository from "../repositories/secureNote.repository.js";

const toBuffer = (value) => Buffer.from(value, "base64");
const validateId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid secure note ID.");
};
const publicNote = (note) => ({
  id: note._id,
  encryptedData: note.encryptedData.toString("base64"),
  iv: note.iv.toString("base64"),
  authTag: note.authTag.toString("base64"),
  favorite: note.favorite,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

class SecureNoteService {
  async ownedVault(userId) {
    const vault = await vaultRepository.findByUserId(userId);
    if (!vault) throw new ApiError(404, "Vault not found.");
    return vault;
  }

  async create(userId, data) {
    const vault = await this.ownedVault(userId);
    return publicNote(await secureNoteRepository.create({
      vaultId: vault._id, encryptedData: toBuffer(data.encryptedData), iv: toBuffer(data.iv),
      authTag: toBuffer(data.authTag), favorite: data.favorite,
    }));
  }

  async get(userId, id) {
    validateId(id);
    const vault = await this.ownedVault(userId);
    const note = await secureNoteRepository.findByIdAndVaultId(id, vault._id);
    if (!note) throw new ApiError(404, "Secure note not found.");
    return publicNote(note);
  }

  async list(userId, options) {
    const vault = await this.ownedVault(userId);
    const notes = await secureNoteRepository.listByVaultId(vault._id, options);
    return { items: notes.map(publicNote), page: options.page, limit: options.limit, hasMore: notes.length === options.limit };
  }

  async update(userId, id, data) {
    validateId(id);
    const vault = await this.ownedVault(userId);
    const update = {};
    if (data.encryptedData !== undefined) update.encryptedData = toBuffer(data.encryptedData);
    if (data.iv !== undefined) update.iv = toBuffer(data.iv);
    if (data.authTag !== undefined) update.authTag = toBuffer(data.authTag);
    if (data.favorite !== undefined) update.favorite = data.favorite;
    const note = await secureNoteRepository.updateByIdAndVaultId(id, vault._id, update);
    if (!note) throw new ApiError(404, "Secure note not found.");
    return publicNote(note);
  }

  async delete(userId, id) {
    validateId(id);
    const vault = await this.ownedVault(userId);
    const note = await secureNoteRepository.deleteByIdAndVaultId(id, vault._id);
    if (!note) throw new ApiError(404, "Secure note not found.");
    return null;
  }
}

export default new SecureNoteService();
