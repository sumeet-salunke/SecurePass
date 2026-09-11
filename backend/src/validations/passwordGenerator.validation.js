import { z } from "zod";
import { PASSWORD_GENERATOR_DEFAULTS } from "../utils/passwordGenerator.js";

export const passwordGeneratorSchema = z.object({
  length: z.number().int("Length must be an integer.").min(8, "Length must be at least 8.").max(128, "Length must not exceed 128.").default(PASSWORD_GENERATOR_DEFAULTS.length),
  lowercase: z.boolean().default(PASSWORD_GENERATOR_DEFAULTS.lowercase),
  uppercase: z.boolean().default(PASSWORD_GENERATOR_DEFAULTS.uppercase),
  numbers: z.boolean().default(PASSWORD_GENERATOR_DEFAULTS.numbers),
  symbols: z.boolean().default(PASSWORD_GENERATOR_DEFAULTS.symbols),
}).strict()
  .refine(
    (options) => options.lowercase || options.uppercase || options.numbers || options.symbols,
    "At least one character category must be enabled."
  )
  .refine(
    (options) => options.length >= [options.lowercase, options.uppercase, options.numbers, options.symbols].filter(Boolean).length,
    "Length is too short for the selected categories."
  );
