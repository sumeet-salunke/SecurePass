//Node.js built-in crypto module
import crypto from "crypto";
import argon2 from "argon2";
/**
 * Generates a cryptographically secure random salt
 * The salt is not secret
 * It is used together with master password during vault key derivtion
 */
export const generateSalt = () => {
  return crypto.randomBytes(16);
};

/**
 * Derive's a 256-bit vault encrypton key from the user's master password and salt.
 * 
 * Argon2id is intentionally memory-intensive and computationally expensive, making brute-force password guessing more difficult.
 */

/*
Here we're not using Argon2 to store a password hash.

We're asking Argon2id:

"Take this master password and this salt and deterministically produce 32 bytes that we can use as an encryption key."
*/

//KEK derivation -> Key Encryption key
export const deriveKeyEncryptionKey = async (masterPassword, salt) => {
  const keyEncryptionKey = await argon2.hash(masterPassword, {
    type: argon2.argon2id,

    //Amount of memory Argon2 is allowed to use.
    memoryCost: 65536,
    //Number of iterations.
    timeCost: 3,
    //Number of parallel threads.
    parallelism: 4,

    //we need 32 bytes = 256 bits for AES-256
    hashLength: 32,

    //use the salt that belongs to this vault
    salt,
    // Return the raw derived rather than Argon's normal encoded password-hash string
    raw: true,
  });
  return keyEncryptionKey;
}

/*
Important distinction:

KEK → derived from the master password.
VEK → randomly generated, independent of the master password.
KEK will encrypt/wrap the VEK.
VEK will encrypt the actual vault data
*/

/*
Why raw: true?
-> Normally Argon2 gives you an encoded string containing information such as the algorithm and parameters
we need the actual bytes: 32 bytes  because AES-256-GCM needs a 256-bit key
why hasLenght: 32
-> we need 32 bytes*8=256 bits

*/
//Generate a random Vault Encryption key(VEK)
export const generateVaultEncryptionKey = () => {
  //32 bytes = 256 bits
  // this key will eventually encrypt the actual vault data
  return crypto.randomBytes(32);
};

//Encrypt plaintext using AES-256-GCM and the VEK
export const encryptData = (plainText, vaultEncryptionKey) => {
  //AES-256-GCM requires a 32-byte encryption key.
  //generate a fresh 12-byte IV for every encrytpion operation
  const iv = crypto.randomBytes(12);

  //Create the AES-256-GCM cipher.
  const cipher = crypto.createCipheriv("aes-256-gcm", vaultEncryptionKey, iv);

  //encrypt the plaintext
  const encrypted = Buffer.concat([
    cipher.update(plainText, "uft8"),
    cipher.final(),
  ]);
  //GCM generates an authenticated tag
  const authTag = cipher.getAuthTag();
  return { encrypted, iv, authTag };

};
// Decrypt AES-256-GCM encrypted data using the VEK
export const decryptData = (
  encrypted,
  vaultEncryptionKey,
  iv,
  authTag
) => {
  // Create the AES-256-GCM decipher using the same VEK and IV.
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    vaultEncryptionKey,
    iv
  );

  // Provide the authentication tag generated during encryption.
  // GCM uses this to verify that the encrypted data was not modified.
  decipher.setAuthTag(authTag);

  // Decrypt the ciphertext.
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  // Convert the decrypted Buffer back into UTF-8 text.
  return decrypted.toString("utf8");
};

// Encrypt (wrap) the VEK using the KEK.
export const wrapVaultEncryptionKey = (
  vaultEncryptionKey,
  keyEncryptionKey
) => {
  // Generate a fresh IV specifically for VEK wrapping.
  const iv = crypto.randomBytes(12);

  // Use the KEK to encrypt the VEK.
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    keyEncryptionKey,
    iv
  );

  const encryptedVaultKey = Buffer.concat([
    cipher.update(vaultEncryptionKey),
    cipher.final(),
  ]);

  // Authentication tag protects the wrapped VEK from tampering.
  const authTag = cipher.getAuthTag();

  return {
    encryptedVaultKey,
    iv,
    authTag,
  };
};

// Decrypt (unwrap) the VEK using the KEK.
export const unwrapVaultEncryptionKey = (
  encryptedVaultKey,
  keyEncryptionKey,
  iv,
  authTag
) => {
  // Create the AES-256-GCM decipher using the KEK and
  // the same IV that was used when wrapping the VEK.
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    keyEncryptionKey,
    iv
  );

  // Provide the authentication tag so GCM can verify
  // that the wrapped VEK has not been modified.
  decipher.setAuthTag(authTag);

  // Decrypt the wrapped VEK.
  const vaultEncryptionKey = Buffer.concat([
    decipher.update(encryptedVaultKey),
    decipher.final(),
  ]);

  return vaultEncryptionKey;
};