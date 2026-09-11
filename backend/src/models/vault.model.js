import mongoose from "mongoose";

const vaultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },
  vaultSalt: {
    type: Buffer,
    required: true,
  },
  encryptedVaultKey: {
    type: Buffer,
    required: true,
  },
  vaultKeyIv: {
    type: Buffer,
    required: true,
  },
  vaultKeyAuthTag: {
    type: Buffer,
    required: true,
  },
}, {
  timestamps: true
});

const Vault = mongoose.model("Vault", vaultSchema);

export default Vault;