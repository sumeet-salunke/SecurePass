import { z } from "zod";

const base64 = (field, maxBytes) => z.string()
  .min(1, `${field} is required.`)
  .max(Math.ceil(maxBytes * 4 / 3) + 4, `${field} is too large.`)
  .refine((value) => {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) return false;
    try { return Buffer.from(value, "base64").length <= maxBytes; } catch { return false; }
  }, `${field} must be valid base64.`);

const exactBase64 = (field, bytes) => base64(field, bytes)
  .refine((value) => Buffer.from(value, "base64").length === bytes, `${field} has an invalid length.`);

export const vaultSchema = z.object({
  vaultSalt: exactBase64("vaultSalt", 16),
  encryptedVaultKey: exactBase64("encryptedVaultKey", 32),
  vaultKeyIv: exactBase64("vaultKeyIv", 12),
  vaultKeyAuthTag: exactBase64("vaultKeyAuthTag", 16),
}).strict();

export const credentialSchema = z.object({
  encryptedData: base64("encryptedData", 256 * 1024),
  iv: exactBase64("iv", 12),
  authTag: exactBase64("authTag", 16),
}).strict();
