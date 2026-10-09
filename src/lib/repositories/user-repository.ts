import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "ANALYST" | "VIEWER";
  planTier: "FREE" | "CREATOR" | "PRO" | "AGENCY";
}

export interface UserWithWorkspace {
  user: UserRecord;
  workspace: WorkspaceRecord;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".data");
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, "users.json");

interface LocalStoreData {
  users: UserRecord[];
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    userId: string;
    role: string;
    planTier: string;
  }>;
}

function readLocalStore(): LocalStoreData {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_FILE)) {
      return { users: [], workspaces: [] };
    }
    const content = fs.readFileSync(LOCAL_STORAGE_FILE, "utf-8");
    return JSON.parse(content) || { users: [], workspaces: [] };
  } catch {
    return { users: [], workspaces: [] };
  }
}

function writeLocalStore(data: LocalStoreData): void {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write local user store:", err);
  }
}

export class UserRepository {
  /**
   * Finds a user by email, checking PostgreSQL first, then local fallback store
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try PostgreSQL via Prisma
    try {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (user && user.passwordHash) {
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          passwordHash: user.passwordHash,
          avatarUrl: user.avatarUrl || undefined,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      }
    } catch {
      // Prisma / PostgreSQL offline, fall through to local fallback
    }

    // 2. Local fallback store
    const store = readLocalStore();
    const localUser = store.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    return localUser || null;
  }

  /**
   * Finds a user by ID
   */
  async findById(id: string): Promise<UserRecord | null> {
    // 1. Try PostgreSQL
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (user && user.passwordHash) {
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          passwordHash: user.passwordHash,
          avatarUrl: user.avatarUrl || undefined,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      }
    } catch {
      // fallback
    }

    // 2. Local fallback
    const store = readLocalStore();
    return store.users.find((u) => u.id === id) || null;
  }

  /**
   * Retrieves user profile along with primary workspace details
   */
  async getUserWithWorkspace(userId: string): Promise<UserWithWorkspace | null> {
    // 1. Try PostgreSQL
    try {
      const member = await prisma.teamMember.findFirst({
        where: { userId },
        include: {
          user: true,
          workspace: {
            include: {
              subscription: true,
            },
          },
        },
      });

      if (member && member.user && member.workspace) {
        return {
          user: {
            id: member.user.id,
            email: member.user.email,
            name: member.user.name || member.user.email.split("@")[0],
            passwordHash: member.user.passwordHash || "",
            avatarUrl: member.user.avatarUrl || undefined,
            createdAt: member.user.createdAt.toISOString(),
            updatedAt: member.user.updatedAt.toISOString(),
          },
          workspace: {
            id: member.workspace.id,
            name: member.workspace.name,
            slug: member.workspace.slug,
            role: member.role as any,
            planTier: (member.workspace.subscription?.tier as any) || "FREE",
          },
        };
      }
    } catch {
      // fallback
    }

    // 2. Local fallback
    const store = readLocalStore();
    const user = store.users.find((u) => u.id === userId);
    if (!user) return null;

    const workspace = store.workspaces.find((w) => w.userId === userId) || {
      id: `ws_${user.id}`,
      name: `${user.name}'s Workspace`,
      slug: `ws-${user.id.substring(0, 8)}`,
      role: "OWNER",
      planTier: "FREE",
    };

    return {
      user,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: workspace.role as any,
        planTier: workspace.planTier as any,
      },
    };
  }

  /**
   * Registers and persists a new user, automatically creating their default workspace
   */
  async createUser(params: {
    email: string;
    password: string;
    name?: string;
  }): Promise<UserWithWorkspace> {
    const normalizedEmail = params.email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    const passwordHash = await hashPassword(params.password);
    const displayName = params.name?.trim() || normalizedEmail.split("@")[0];
    const userSlug = displayName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "creator";
    const workspaceSlug = `${userSlug}-${crypto.randomBytes(3).toString("hex")}`;
    const workspaceName = `${displayName}'s Workspace`;

    // 1. Try PostgreSQL
    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: displayName,
            passwordHash,
          },
        });

        const workspace = await tx.workspace.create({
          data: {
            name: workspaceName,
            slug: workspaceSlug,
            subscription: {
              create: {
                tier: "FREE",
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 3600 * 1000),
              },
            },
            members: {
              create: {
                userId: user.id,
                role: "OWNER",
              },
            },
          },
          include: {
            subscription: true,
          },
        });

        return { user, workspace };
      });

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name || displayName,
          passwordHash: result.user.passwordHash || passwordHash,
          avatarUrl: result.user.avatarUrl || undefined,
          createdAt: result.user.createdAt.toISOString(),
          updatedAt: result.user.updatedAt.toISOString(),
        },
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
          slug: result.workspace.slug,
          role: "OWNER",
          planTier: (result.workspace.subscription?.tier as any) || "FREE",
        },
      };
    } catch {
      // 2. Local fallback
      const userId = `usr_${crypto.randomBytes(8).toString("hex")}`;
      const workspaceId = `ws_${crypto.randomBytes(8).toString("hex")}`;
      const now = new Date().toISOString();

      const userRecord: UserRecord = {
        id: userId,
        email: normalizedEmail,
        name: displayName,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      };

      const workspaceRecord: WorkspaceRecord = {
        id: workspaceId,
        name: workspaceName,
        slug: workspaceSlug,
        role: "OWNER",
        planTier: "FREE",
      };

      const store = readLocalStore();
      store.users.push(userRecord);
      store.workspaces.push({
        ...workspaceRecord,
        userId,
      });
      writeLocalStore(store);

      return {
        user: userRecord,
        workspace: workspaceRecord,
      };
    }
  }
}

export const userRepository = new UserRepository();
