import fs from "fs";
import path from "path";
import { encryptToken, decryptToken } from "@/lib/crypto";

export interface StoredUserKey {
  userId: string;
  provider: "youtube" | "gemini" | "openai";
  encryptedKey: string;
  keyPrefix: string;
  keySuffix: string;
  isValidated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserKeyPublicInfo {
  provider: "youtube" | "gemini" | "openai";
  isConfigured: boolean;
  maskedKey: string | null;
  isValidated: boolean;
  updatedAt: string | null;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".data");
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, "user-keys.json");

function readLocalKeys(): StoredUserKey[] {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_FILE)) return [];
    const content = fs.readFileSync(LOCAL_STORAGE_FILE, "utf-8");
    return JSON.parse(content) || [];
  } catch {
    return [];
  }
}

function writeLocalKeys(keys: StoredUserKey[]): void {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(keys, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write local keys store:", err);
  }
}

export class UserKeysRepository {
  /**
   * Encrypts and saves an external API key for a specific user
   */
  async saveKey(
    userId: string,
    provider: "youtube" | "gemini" | "openai",
    rawKey: string,
    isValidated: boolean = true
  ): Promise<UserKeyPublicInfo> {
    const trimmed = rawKey.trim();
    if (!trimmed) {
      throw new Error("Key cannot be empty");
    }

    const encryptedKey = encryptToken(trimmed);
    const keyPrefix = trimmed.length > 8 ? trimmed.slice(0, 6) : trimmed.slice(0, 3);
    const keySuffix = trimmed.length > 8 ? trimmed.slice(-4) : trimmed.slice(-2);
    const now = new Date().toISOString();

    const storedKeys = readLocalKeys();
    const existingIndex = storedKeys.findIndex(
      (k) => k.userId === userId && k.provider === provider
    );

    const record: StoredUserKey = {
      userId,
      provider,
      encryptedKey,
      keyPrefix,
      keySuffix,
      isValidated,
      createdAt: existingIndex !== -1 ? storedKeys[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex !== -1) {
      storedKeys[existingIndex] = record;
    } else {
      storedKeys.push(record);
    }

    writeLocalKeys(storedKeys);

    return {
      provider,
      isConfigured: true,
      maskedKey: `${keyPrefix}...${keySuffix}`,
      isValidated,
      updatedAt: now,
    };
  }

  /**
   * Retrieves decrypted raw API key for internal backend queries
   */
  async getRawKey(
    userId: string,
    provider: "youtube" | "gemini" | "openai"
  ): Promise<string | null> {
    const storedKeys = readLocalKeys();
    const found = storedKeys.find(
      (k) => k.userId === userId && k.provider === provider
    );

    if (!found) return null;

    try {
      return decryptToken(found.encryptedKey);
    } catch (err) {
      console.error(`Failed to decrypt key for user ${userId} provider ${provider}:`, err);
      return null;
    }
  }

  /**
   * Retrieves public masked metadata for UI presentation
   */
  async getUserKeys(userId: string): Promise<Record<string, UserKeyPublicInfo>> {
    const storedKeys = readLocalKeys();
    const userRecords = storedKeys.filter((k) => k.userId === userId);

    const providers: Array<"youtube" | "gemini" | "openai"> = ["youtube", "gemini", "openai"];
    const result: Record<string, UserKeyPublicInfo> = {};

    for (const p of providers) {
      const rec = userRecords.find((r) => r.provider === p);
      result[p] = {
        provider: p,
        isConfigured: !!rec,
        maskedKey: rec ? `${rec.keyPrefix}...${rec.keySuffix}` : null,
        isValidated: rec ? rec.isValidated : false,
        updatedAt: rec ? rec.updatedAt : null,
      };
    }

    return result;
  }

  /**
   * Removes a saved key for a provider
   */
  async removeKey(
    userId: string,
    provider: "youtube" | "gemini" | "openai"
  ): Promise<boolean> {
    const storedKeys = readLocalKeys();
    const filtered = storedKeys.filter(
      (k) => !(k.userId === userId && k.provider === provider)
    );
    writeLocalKeys(filtered);
    return true;
  }
}

export const userKeysRepository = new UserKeysRepository();
