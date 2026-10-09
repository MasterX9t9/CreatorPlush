import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password with a stored bcrypt hash
 */
export async function comparePassword(
  plainText: string,
  hashedPassword?: string | null
): Promise<boolean> {
  if (!plainText || !hashedPassword) {
    return false;
  }
  try {
    return await bcrypt.compare(plainText, hashedPassword);
  } catch {
    return false;
  }
}
