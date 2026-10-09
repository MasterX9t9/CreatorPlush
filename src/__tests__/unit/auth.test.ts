import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "@/lib/auth/password";
import { signAuthToken, verifyAuthToken } from "@/lib/auth/jwt";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { userRepository } from "@/lib/repositories/user-repository";

describe("Authentication & Security Engine", () => {
  describe("Password Hashing (bcrypt)", () => {
    it("hashes password with high entropy and verifies correctly", async () => {
      const rawPassword = "StrongPassword123!";
      const hash = await hashPassword(rawPassword);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(rawPassword);
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

      const isValid = await comparePassword(rawPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword("WrongPassword!", hash);
      expect(isInvalid).toBe(false);
    });

    it("rejects passwords shorter than 8 characters", async () => {
      await expect(hashPassword("short")).rejects.toThrow(
        "Password must be at least 8 characters long."
      );
    });
  });

  describe("JWT Token Management", () => {
    it("signs and successfully verifies an auth token payload", () => {
      const payload = {
        userId: "usr_test123",
        email: "test@example.com",
        name: "Test User",
        workspaceId: "ws_test123",
        role: "OWNER",
        planTier: "FREE",
      };

      const token = signAuthToken(payload);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);

      const verified = verifyAuthToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.workspaceId).toBe(payload.workspaceId);
    });

    it("returns null for tampered or invalid tokens", () => {
      const verified = verifyAuthToken("invalid.tampered.token");
      expect(verified).toBeNull();
    });
  });

  describe("Sliding Window Rate Limiter", () => {
    it("allows requests up to the configured limit and blocks subsequent ones", () => {
      const testKey = `test_ip_${Date.now()}`;
      const limit = 3;

      // 3 requests allowed
      expect(checkRateLimit(testKey, limit, 60).allowed).toBe(true);
      expect(checkRateLimit(testKey, limit, 60).allowed).toBe(true);
      expect(checkRateLimit(testKey, limit, 60).allowed).toBe(true);

      // 4th request blocked
      const blocked = checkRateLimit(testKey, limit, 60);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetSeconds).toBeGreaterThan(0);
    });
  });

  describe("UserRepository Multi-Tenant Workflow", () => {
    it("creates a new user with dedicated default workspace and prevents duplicates", async () => {
      const uniqueEmail = `creator_${Date.now()}@pulse.test`;
      const created = await userRepository.createUser({
        email: uniqueEmail,
        password: "SuperSecretPassword123!",
        name: "Test Creator",
      });

      expect(created.user.id).toBeDefined();
      expect(created.user.email).toBe(uniqueEmail);
      expect(created.workspace.id).toBeDefined();
      expect(created.workspace.role).toBe("OWNER");
      expect(created.workspace.planTier).toBe("FREE");

      // Verify lookup by email
      const found = await userRepository.findByEmail(uniqueEmail);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.user.id);

      // Duplicate registration must fail
      await expect(
        userRepository.createUser({
          email: uniqueEmail,
          password: "AnotherPassword123!",
        })
      ).rejects.toThrow("already exists");
    });
  });
});
