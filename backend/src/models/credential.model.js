import mongoose from "mongoose";

const credentialSchema = new mongoose.Schema({
  vaultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vault",
    required: true,
    index: true,
  },
  encryptedData: {
    type: Buffer,
    required: true,
    maxlength: 256 * 1024,
  },
  iv: {
    type: Buffer,
    required: true,
  },
  authTag: {
    type: Buffer,
    required: true,
  },
  category: {
    type: String,
    enum: ["Login", "Banking", "Email", "Social", "Work", "Shopping", "Other"],
    default: "Login",
  },
  favorite: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true });

credentialSchema.index({ vaultId: 1, createdAt: -1 });

const Credential = mongoose.model("Credential", credentialSchema);
export default Credential;
