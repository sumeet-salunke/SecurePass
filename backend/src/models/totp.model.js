import mongoose from "mongoose";

const totpSchema = new mongoose.Schema({
  vaultId: { type: mongoose.Schema.Types.ObjectId, ref: "Vault", required: true, index: true },
  // Secret, issuer, and account are encrypted together in this opaque payload.
  encryptedData: { type: Buffer, required: true, maxlength: 256 * 1024 },
  iv: { type: Buffer, required: true },
  authTag: { type: Buffer, required: true },
  algorithm: { type: String, enum: ["SHA1", "SHA256", "SHA512"], default: "SHA1" },
  digits: { type: Number, enum: [6, 8], default: 6 },
  period: { type: Number, min: 15, max: 120, default: 30 },
}, { timestamps: true });

totpSchema.index({ vaultId: 1, createdAt: -1 });

const TOTP = mongoose.model("TOTP", totpSchema);
export default TOTP;
