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

export const categories = ["Login", "Banking", "Email", "Social", "Work", "Shopping", "Other"];
export const encryptedPayloadFields = {
  encryptedData: base64("encryptedData", 256 * 1024),
  iv: exactBase64("iv", 12),
  authTag: exactBase64("authTag", 16),
};

const category = z.enum(categories);

export const vaultSchema = z.object({
  vaultSalt: exactBase64("vaultSalt", 16),
  encryptedVaultKey: exactBase64("encryptedVaultKey", 32),
  vaultKeyIv: exactBase64("vaultKeyIv", 12),
  vaultKeyAuthTag: exactBase64("vaultKeyAuthTag", 16),
}).strict();

export const credentialSchema = z.object({
  ...encryptedPayloadFields,
  category: category.default("Login"),
  favorite: z.boolean().default(false),
}).strict();

export const credentialUpdateSchema = z.object({
  encryptedData: encryptedPayloadFields.encryptedData.optional(),
  iv: encryptedPayloadFields.iv.optional(),
  authTag: encryptedPayloadFields.authTag.optional(),
  category: category.optional(),
  favorite: z.boolean().optional(),
}).strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.")
  .refine((data) => {
    const encryptedFields = [data.encryptedData, data.iv, data.authTag];
    return encryptedFields.every((field) => field === undefined) || encryptedFields.every((field) => field !== undefined);
  }, "Encrypted data, IV, and authentication tag must be provided together.");

export const secureNoteSchema = z.object({
  ...encryptedPayloadFields,
  favorite: z.boolean().default(false),
}).strict();

export const secureNoteUpdateSchema = z.object({
  encryptedData: encryptedPayloadFields.encryptedData.optional(),
  iv: encryptedPayloadFields.iv.optional(),
  authTag: encryptedPayloadFields.authTag.optional(),
  favorite: z.boolean().optional(),
}).strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.")
  .refine((data) => {
    const encryptedFields = [data.encryptedData, data.iv, data.authTag];
    return encryptedFields.every((field) => field === undefined) || encryptedFields.every((field) => field !== undefined);
  }, "Encrypted data, IV, and authentication tag must be provided together.");

export const totpSchema = z.object({
  ...encryptedPayloadFields,
  algorithm: z.enum(["SHA1", "SHA256", "SHA512"]).default("SHA1"),
  digits: z.union([z.literal(6), z.literal(8)]).default(6),
  period: z.number().int().min(15).max(120).default(30),
}).strict();

export const totpUpdateSchema = z.object({
  encryptedData: encryptedPayloadFields.encryptedData.optional(),
  iv: encryptedPayloadFields.iv.optional(),
  authTag: encryptedPayloadFields.authTag.optional(),
  algorithm: z.enum(["SHA1", "SHA256", "SHA512"]).optional(),
  digits: z.union([z.literal(6), z.literal(8)]).optional(),
  period: z.number().int().min(15).max(120).optional(),
}).strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.")
  .refine((data) => {
    const encryptedFields = [data.encryptedData, data.iv, data.authTag];
    return encryptedFields.every((field) => field === undefined) || encryptedFields.every((field) => field !== undefined);
  }, "Encrypted data, IV, and authentication tag must be provided together.");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  favorite: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
}).strict();
