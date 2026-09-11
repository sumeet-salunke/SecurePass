import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { generatePassword } from "../src/utils/passwordGenerator.js";
import { passwordGeneratorSchema } from "../src/validations/passwordGenerator.validation.js";

const categories = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  numbers: /[0-9]/,
  symbols: /[!@#$%^&*()\-_=+\[\]{};:,.?]/,
};

test("generates a default password with the default length", () => {
  const password = generatePassword();
  assert.equal(password.length, 20);
});

test("supports custom length and guarantees every enabled category", () => {
  const options = { length: 24, lowercase: true, uppercase: true, numbers: true, symbols: true };
  const password = generatePassword(options);
  assert.equal(password.length, options.length);
  for (const [category, pattern] of Object.entries(categories)) {
    assert.match(password, pattern, `${category} category missing`);
  }
});

test("supports each individual category", () => {
  for (const category of Object.keys(categories)) {
    const options = { length: 12, lowercase: false, uppercase: false, numbers: false, symbols: false, [category]: true };
    const password = generatePassword(options);
    assert.equal(password.length, 12);
    assert.match(password, categories[category]);
  }
});

test("different generations are not identical", () => {
  assert.notEqual(generatePassword({ length: 32 }), generatePassword({ length: 32 }));
});

test("validation applies defaults and rejects unsafe input", () => {
  const defaults = passwordGeneratorSchema.parse({});
  assert.equal(defaults.length, 20);
  assert.equal(passwordGeneratorSchema.safeParse({ length: 8 }).success, true);
  assert.equal(passwordGeneratorSchema.safeParse({ length: 128 }).success, true);
  assert.equal(passwordGeneratorSchema.safeParse({ length: 7 }).success, false);
  assert.equal(passwordGeneratorSchema.safeParse({ length: 129 }).success, false);
  assert.equal(passwordGeneratorSchema.safeParse({ length: 12, lowercase: false, uppercase: false, numbers: false, symbols: false }).success, false);
  assert.equal(passwordGeneratorSchema.safeParse({ length: 12, lowercase: "true" }).success, false);
  assert.equal(passwordGeneratorSchema.safeParse({ length: 12, extra: true }).success, false);
});

test("validation rejects a length shorter than selected categories", () => {
  assert.equal(passwordGeneratorSchema.safeParse({ length: 2, lowercase: true, uppercase: true, numbers: true }).success, false);
});

test("generator source does not use predictable randomness", async () => {
  const source = await readFile(new URL("../src/utils/passwordGenerator.js", import.meta.url), "utf8");
  assert.equal(/Math\.random\s*\(/.test(source), false);
});
