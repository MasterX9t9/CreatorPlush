import { NextRequest } from "next/server";
import { AuthTokenPayload, verifyAuthToken } from "./jwt";

export const SESSION_COOKIE_NAME = "cp_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface UserSession {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  workspace: {
    id: string;
    role: string;
    planTier: string;
  };
}

/**
 * Extracts and verifies the user session from the request cookie or Bearer header
 */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<UserSession | null> {
  // 1. Try cookie
  let token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 2. Try Authorization: Bearer <token>
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return null;
  }

  const payload: AuthTokenPayload | null = verifyAuthToken(token);
  if (!payload) {
    return null;
  }

  return {
    user: {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
    },
    workspace: {
      id: payload.workspaceId,
      role: payload.role,
      planTier: payload.planTier,
    },
  };
}

/**
 * Generates the Set-Cookie header value for establishing an authenticated session
 */
export function createSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${
    isProd ? "; Secure" : ""
  }`;
}

/**
 * Generates the Set-Cookie header value for logging out and clearing the session
 */
export function createLogoutCookie(): string {
  const isProd = process.env.NODE_ENV === "production";
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
    isProd ? "; Secure" : ""
  }`;
}
