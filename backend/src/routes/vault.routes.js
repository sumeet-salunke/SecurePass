import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { vaultSchema, credentialSchema } from "../validations/vault.validation.js";
import { createVault, getVault, deleteVault } from "../controllers/vault.controller.js";
import { createCredential, getCredential, listCredentials, updateCredential, deleteCredential } from "../controllers/credential.controller.js";

const router = express.Router();
router.use(authenticate);

router.post("/", validate(vaultSchema), createVault);
router.get("/", getVault);
router.delete("/", deleteVault);

router.post("/credentials", validate(credentialSchema), createCredential);
router.get("/credentials", listCredentials);
router.get("/credentials/:credentialId", getCredential);
router.patch("/credentials/:credentialId", validate(credentialSchema), updateCredential);
router.delete("/credentials/:credentialId", deleteCredential);

export default router;
