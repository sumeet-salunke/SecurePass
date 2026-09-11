import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { passwordGeneratorSchema } from "../validations/passwordGenerator.validation.js";
import { generatePassword } from "../controllers/passwordGenerator.controller.js";

const router = express.Router();

router.post("/", authenticate, validate(passwordGeneratorSchema), generatePassword);

export default router;
