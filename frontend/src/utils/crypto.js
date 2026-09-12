/**
 * Zero-Knowledge Cryptography Utilities for SecurePass
 * 
 * Cryptographic rules:
 * - Master Password, KEK, and unencrypted VEK are NEVER transmitted or stored in persistent storage.
 * - PBKDF2 (SHA-256, 100,000 iterations) derives the 256-bit Key Encryption Key (KEK).
 * - AES-256-GCM is used for VEK wrapping and all item encryption.
 * - Nonce/IV is 12 random bytes; Authentication Tag is 16 bytes.
 */

// Base64 <-> Uint8Array conversions
export function uint8ArrayToBase64(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToUint8Array(base64) {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate cryptographically secure random bytes
export function getRandomBytes(length) {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Derive Key Encryption Key (KEK) from Master Password + Salt using PBKDF2
 * @param {string} masterPassword 
 * @param {Uint8Array} saltBytes (16 bytes)
 * @param {number} iterations (default: 100,000)
 * @returns {Promise<CryptoKey>} AES-256-GCM CryptoKey
 */
export async function deriveKEK(masterPassword, saltBytes, iterations = 100000) {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a raw 32-byte Vault Encryption Key (VEK) using KEK with AES-256-GCM
 * @param {Uint8Array} vekBytes (32 bytes)
 * @param {CryptoKey} kekKey 
 * @returns {Promise<{ encryptedVaultKey: string, vaultKeyIv: string, vaultKeyAuthTag: string }>}
 */
export async function encryptVaultKey(vekBytes, kekKey) {
  const iv = getRandomBytes(12);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    kekKey,
    vekBytes
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  // WebCrypto appends the 16-byte auth tag at the end of the ciphertext
  const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);
  const authTag = encryptedArray.slice(encryptedArray.length - 16);

  return {
    encryptedVaultKey: uint8ArrayToBase64(ciphertext),
    vaultKeyIv: uint8ArrayToBase64(iv),
    vaultKeyAuthTag: uint8ArrayToBase64(authTag)
  };
}

/**
 * Decrypt the Vault Encryption Key using KEK
 * @param {string} encryptedVaultKeyB64 (32 bytes base64)
 * @param {string} vaultKeyIvB64 (12 bytes base64)
 * @param {string} vaultKeyAuthTagB64 (16 bytes base64)
 * @param {CryptoKey} kekKey 
 * @returns {Promise<CryptoKey>} Decrypted AES-256-GCM CryptoKey (VEK)
 */
export async function decryptVaultKey(encryptedVaultKeyB64, vaultKeyIvB64, vaultKeyAuthTagB64, kekKey) {
  const ciphertext = base64ToUint8Array(encryptedVaultKeyB64);
  const iv = base64ToUint8Array(vaultKeyIvB64);
  const authTag = base64ToUint8Array(vaultKeyAuthTagB64);

  // Combine ciphertext + authTag for WebCrypto AES-GCM
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv, tagLength: 128 },
      kekKey,
      combined
    );

    // Import raw decrypted 32-byte VEK into a CryptoKey for encrypting/decrypting vault items
    return await window.crypto.subtle.importKey(
      "raw",
      decryptedBuffer,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  } catch (err) {
    throw new Error("Incorrect master password. Cryptographic authentication failed.");
  }
}

/**
 * Encrypt arbitrary JSON/text data with the Vault Encryption Key (VEK)
 * @param {object|string} data 
 * @param {CryptoKey} vekKey 
 * @returns {Promise<{ encryptedData: string, iv: string, authTag: string }>}
 */
export async function encryptData(data, vekKey) {
  const enc = new TextEncoder();
  const plaintext = typeof data === "string" ? data : JSON.stringify(data);
  const iv = getRandomBytes(12);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    vekKey,
    enc.encode(plaintext)
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);
  const authTag = encryptedArray.slice(encryptedArray.length - 16);

  return {
    encryptedData: uint8ArrayToBase64(ciphertext),
    iv: uint8ArrayToBase64(iv),
    authTag: uint8ArrayToBase64(authTag)
  };
}

/**
 * Decrypt encrypted payload with the Vault Encryption Key (VEK)
 * @param {string} encryptedDataB64 
 * @param {string} ivB64 
 * @param {string} authTagB64 
 * @param {CryptoKey} vekKey 
 * @returns {Promise<any>} Parsed JSON or string
 */
export async function decryptData(encryptedDataB64, ivB64, authTagB64, vekKey) {
  const ciphertext = base64ToUint8Array(encryptedDataB64);
  const iv = base64ToUint8Array(ivB64);
  const authTag = base64ToUint8Array(authTagB64);

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    vekKey,
    combined
  );

  const dec = new TextDecoder();
  const text = dec.decode(decryptedBuffer);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Base32 decode helper for TOTP secret keys
 */
function base32ToUint8Array(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const output = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned.charAt(i));
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

/**
 * Client-Side RFC 6238 TOTP computation using Web Crypto HMAC
 * @param {string} secret 
 * @param {string} algorithm ('SHA1' | 'SHA256' | 'SHA512')
 * @param {number} digits (6 | 8)
 * @param {number} period (default 30)
 * @returns {Promise<{ code: string, remainingSeconds: number, progress: number }>}
 */
export async function generateTOTPCode(secret, algorithm = "SHA1", digits = 6, period = 30) {
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / period);
  const remainingSeconds = period - (now % period);
  const progress = (remainingSeconds / period) * 100;

  try {
    const keyBytes = base32ToUint8Array(secret);
    if (keyBytes.length === 0) {
      return { code: "------", remainingSeconds, progress };
    }

    const hashAlgo = algorithm === "SHA256" ? "SHA-256" : algorithm === "SHA512" ? "SHA-512" : "SHA-1";

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: { name: hashAlgo } },
      false,
      ["sign"]
    );

    // 8-byte big-endian counter buffer
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setUint32(4, counter, false); // low 32-bits
    counterView.setUint32(0, 0, false);       // high 32-bits

    const hmacBuffer = await window.crypto.subtle.sign("HMAC", cryptoKey, counterBuffer);
    const hmac = new Uint8Array(hmacBuffer);

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const mod = Math.pow(10, digits);
    const otp = (binary % mod).toString().padStart(digits, "0");

    return { code: otp, remainingSeconds, progress };
  } catch (err) {
    console.error("TOTP generation error:", err);
    return { code: "------", remainingSeconds, progress };
  }
}

/**
 * Cryptographically Secure Pseudo-Random Integer in range [0, max - 1]
 * Strictly uses window.crypto.getRandomValues with rejection sampling to eliminate modulo bias.
 */
export function getSecureRandomInt(max) {
  if (max <= 1) return 0;
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % max);
  const randomBuffer = new Uint32Array(1);
  let rand;
  do {
    window.crypto.getRandomValues(randomBuffer);
    rand = randomBuffer[0];
  } while (rand >= limit);
  return rand % max;
}

/**
 * Client-Side Cryptographically Secure Password Generator
 * Strictly uses Web Crypto API (crypto.getRandomValues) with 0% Math.random().
 */
export function generatePassword(options = {}) {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  const charSets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  };

  let allowed = "";
  const required = [];

  if (lowercase) {
    allowed += charSets.lowercase;
    const randIdx = getSecureRandomInt(charSets.lowercase.length);
    required.push(charSets.lowercase[randIdx]);
  }
  if (uppercase) {
    allowed += charSets.uppercase;
    const randIdx = getSecureRandomInt(charSets.uppercase.length);
    required.push(charSets.uppercase[randIdx]);
  }
  if (numbers) {
    allowed += charSets.numbers;
    const randIdx = getSecureRandomInt(charSets.numbers.length);
    required.push(charSets.numbers[randIdx]);
  }
  if (symbols) {
    allowed += charSets.symbols;
    const randIdx = getSecureRandomInt(charSets.symbols.length);
    required.push(charSets.symbols[randIdx]);
  }

  // Fallback if all options were unchecked
  if (allowed.length === 0) {
    allowed = charSets.lowercase + charSets.numbers;
    const randIdx = getSecureRandomInt(charSets.lowercase.length);
    required.push(charSets.lowercase[randIdx]);
  }

  const safeLength = Math.max(8, Math.min(128, length));
  const passwordChars = [...required];

  while (passwordChars.length < safeLength) {
    const randIdx = getSecureRandomInt(allowed.length);
    passwordChars.push(allowed[randIdx]);
  }

  // Cryptographically secure Fisher-Yates shuffle
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join("");
}

/**
 * Calculate Password Strength (0 to 100 score + label)
 */
export function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: "Empty", color: "#64748b" };

  let score = 0;
  if (password.length >= 8) score += 15;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 15;
  if (password.length >= 24) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  score = Math.min(100, score);

  if (score < 40) return { score, label: "Weak", color: "#ef4444" };
  if (score < 70) return { score, label: "Moderate", color: "#f59e0b" };
  if (score < 90) return { score, label: "Strong", color: "#10b981" };
  return { score, label: "Very Strong", color: "#38bdf8" };
}

/**
 * Validate Master Password against zero-knowledge security requirements
 */
export function validateMasterPasswordPolicy(password = "") {
  const minLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  return {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
    isValid: minLength && (hasUpper || hasLower) && (hasNumber || hasSymbol)
  };
}

