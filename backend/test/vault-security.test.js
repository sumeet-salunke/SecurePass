import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import Credential from "../src/models/credential.model.js";
import SecureNote from "../src/models/secureNote.model.js";
import TOTP from "../src/models/totp.model.js";
import {
  credentialSchema,
  credentialUpdateSchema,
  secureNoteSchema,
  totpSchema,
  paginationSchema,
} from "../src/validations/vault.validation.js";

const b64 = (size) => Buffer.alloc(size, 7).toString("base64");
const encryptedPayload = () => ({ encryptedData: b64(32), iv: b64(12), authTag: b64(16) });

test("vault item schemas store opaque encrypted payloads and no plaintext secret fields", () => {
  for (const model of [Credential, SecureNote, TOTP]) {
    assert.ok(model.schema.path("vaultId"));
    assert.ok(model.schema.path("encryptedData"));
    assert.ok(model.schema.path("iv"));
    assert.ok(model.schema.path("authTag"));
    assert.equal(model.schema.path("password"), undefined);
    assert.equal(model.schema.path("secret"), undefined);
  }
});

test("encrypted payload and TOTP metadata validation rejects malformed or unsafe values", () => {
  assert.equal(credentialSchema.safeParse(encryptedPayload()).success, true);
  assert.equal(secureNoteSchema.safeParse(encryptedPayload()).success, true);
  assert.equal(totpSchema.safeParse(encryptedPayload()).success, true);
  assert.equal(credentialSchema.safeParse({ ...encryptedPayload(), iv: b64(11) }).success, false);
  assert.equal(secureNoteSchema.safeParse({ ...encryptedPayload(), encryptedData: b64(256 * 1024 + 1) }).success, false);
  assert.equal(totpSchema.safeParse({ ...encryptedPayload(), digits: 7 }).success, false);
  assert.equal(totpSchema.safeParse({ ...encryptedPayload(), period: 1 }).success, false);
});

test("credential updates allow only explicit metadata or complete encrypted payloads", () => {
  assert.equal(credentialUpdateSchema.safeParse({ favorite: true }).success, true);
  assert.equal(credentialUpdateSchema.safeParse({ category: "Banking" }).success, true);
  assert.equal(credentialUpdateSchema.safeParse({ encryptedData: b64(32) }).success, false);
  assert.equal(credentialUpdateSchema.safeParse({ ...encryptedPayload(), favorite: true }).success, true);
});

test("pagination is bounded and favorite filtering is boolean-safe", () => {
  const parsed = paginationSchema.parse({ page: "2", limit: "100", favorite: "true" });
  assert.deepEqual(parsed, { page: 2, limit: 100, favorite: true });
  assert.equal(paginationSchema.safeParse({ limit: "101" }).success, false);
  assert.equal(paginationSchema.safeParse({ limit: "1000000" }).success, false);
});

test("vault item repositories enforce vault ownership in ID operations", async () => {
  const sources = await Promise.all([
    readFile(new URL("../src/repositories/credential.repository.js", import.meta.url), "utf8"),
    readFile(new URL("../src/repositories/secureNote.repository.js", import.meta.url), "utf8"),
    readFile(new URL("../src/repositories/totp.repository.js", import.meta.url), "utf8"),
  ]);
  for (const source of sources) {
    assert.match(source, /_id:\s*id,\s*vaultId/);
    assert.match(source, /deleteByVaultId/);
  }
});

test("vault routes are authenticated before all vault operations", async () => {
  const source = await readFile(new URL("../src/routes/vault.routes.js", import.meta.url), "utf8");
  assert.match(source, /router\.use\(authenticate\)/);
  assert.doesNotMatch(source, /masterPassword/);
});
