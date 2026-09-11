import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { vaultSchema, credentialSchema, credentialUpdateSchema, secureNoteSchema, secureNoteUpdateSchema, totpSchema, totpUpdateSchema, paginationSchema } from "../validations/vault.validation.js";
import { createVault, getVault, getVaultStats, deleteVault } from "../controllers/vault.controller.js";
import { createCredential, getCredential, listCredentials, updateCredential, deleteCredential } from "../controllers/credential.controller.js";
import { createSecureNote, getSecureNote, listSecureNotes, updateSecureNote, deleteSecureNote } from "../controllers/secureNote.controller.js";
import { createTOTP, getTOTP, listTOTP, updateTOTP, deleteTOTP } from "../controllers/totp.controller.js";
import validateQuery from "../middlewares/validateQuery.middleware.js";

const router = express.Router();
router.use(authenticate);

router.post("/", validate(vaultSchema), createVault);
router.get("/", getVault);
router.get("/stats", getVaultStats);
router.delete("/", deleteVault);

router.post("/credentials", validate(credentialSchema), createCredential);
router.get("/credentials", validateQuery(paginationSchema), listCredentials);
router.get("/credentials/:credentialId", getCredential);
router.patch("/credentials/:credentialId", validate(credentialUpdateSchema), updateCredential);
router.delete("/credentials/:credentialId", deleteCredential);

router.post("/notes", validate(secureNoteSchema), createSecureNote);
router.get("/notes", validateQuery(paginationSchema), listSecureNotes);
router.get("/notes/:noteId", getSecureNote);
router.patch("/notes/:noteId", validate(secureNoteUpdateSchema), updateSecureNote);
router.delete("/notes/:noteId", deleteSecureNote);

router.post("/totp", validate(totpSchema), createTOTP);
router.get("/totp", validateQuery(paginationSchema), listTOTP);
router.get("/totp/:totpId", getTOTP);
router.patch("/totp/:totpId", validate(totpUpdateSchema), updateTOTP);
router.delete("/totp/:totpId", deleteTOTP);

export default router;
