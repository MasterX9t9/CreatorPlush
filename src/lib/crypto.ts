import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY_32_BYTES || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  // If the secret is hex-encoded (64 chars), parse it, otherwise pad/slice to 32 bytes
  if (secret.length === 64) {
    return Buffer.from(secret, "hex");
  }
  return crypto.scryptSync(secret, "salt", 32);
}

/**
 * Encrypt plaintext using AES-256-GCM
 */
export function encryptToken(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt ciphertext using AES-256-GCM
 */
export function decryptToken(cipherString: string): string {
  const parts = cipherString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }
  
  const [ivHex, tagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Cryptographic SHA-256 hash for API keys
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Generates a high-entropy API key with human-readable prefix
 */
export function generateApiKey(prefix = "cp_live"): { rawKey: string; keyHash: string; keyPrefix: string } {
  const entropy = crypto.randomBytes(24).toString("base64url");
  const rawKey = `${prefix}_${entropy}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = `${prefix}_${rawKey.substring(prefix.length + 1, prefix.length + 5)}...`;
  return { rawKey, keyHash, keyPrefix };
}

/**
 * Computes HMAC-SHA256 signature for webhook verification
 */
export function generateHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
