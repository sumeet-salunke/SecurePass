import mongoose from "mongoose";

const secureNoteSchema = new mongoose.Schema({
  vaultId: { type: mongoose.Schema.Types.ObjectId, ref: "Vault", required: true, index: true },
  encryptedData: { type: Buffer, required: true, maxlength: 256 * 1024 },
  iv: { type: Buffer, required: true },
  authTag: { type: Buffer, required: true },
  favorite: { type: Boolean, default: false, index: true },
}, { timestamps: true });

secureNoteSchema.index({ vaultId: 1, createdAt: -1 });

const SecureNote = mongoose.model("SecureNote", secureNoteSchema);
export default SecureNote;
