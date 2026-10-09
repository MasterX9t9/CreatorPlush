import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  workspaceId: string;
  role: string;
  planTier: string;
  name?: string;
}

function getJwtSecret(): string {
  return (
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "creatorpulse-jwt-super-secret-key-32chars"
  );
}

/**
 * Signs a secure JWT authentication token with 7-day expiration
 */
export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
    issuer: "creatorpulse-auth",
    audience: "creatorpulse-app",
  });
}

/**
 * Verifies a JWT authentication token and returns its payload
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      issuer: "creatorpulse-auth",
      audience: "creatorpulse-app",
    }) as AuthTokenPayload;

    if (!decoded || !decoded.userId || !decoded.email) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
