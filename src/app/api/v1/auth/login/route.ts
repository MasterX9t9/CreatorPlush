import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/repositories/user-repository";
import { comparePassword } from "@/lib/auth/password";
import { signAuthToken } from "@/lib/auth/jwt";
import { createSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(request: NextRequest) {
  // 1. Anti-brute force rate limiting (max 10 login attempts per minute per IP)
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`login_${clientIp}`, 10, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: `Too many login attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.`,
          status: 429,
        },
      },
      {
        status: 429,
        headers: { "Retry-After": rateLimit.resetSeconds.toString() },
      }
    );
  }

  try {
    const body = await request.json();
    const validated = LoginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validated.error.issues[0]?.message || "Invalid login credentials.",
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Special convenience: provision demo account if attempting demo login and not yet in store
    if (normalizedEmail === "demo@creatorpulse.com" && password === "CreatorPulse123!") {
      let existingDemo = await userRepository.findByEmail(normalizedEmail);
      if (!existingDemo) {
        await userRepository.createUser({
          email: "demo@creatorpulse.com",
          password: "CreatorPulse123!",
          name: "Demo Creator",
        });
      }
    }

    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password. Please check your credentials.",
            status: 401,
          },
        },
        { status: 401 }
      );
    }

    // Verify password hash with bcrypt
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password. Please check your credentials.",
            status: 401,
          },
        },
        { status: 401 }
      );
    }

    // Fetch user workspace
    const userWithWorkspace = await userRepository.getUserWithWorkspace(user.id);
    const workspace = userWithWorkspace?.workspace || {
      id: `ws_${user.id}`,
      name: `${user.name}'s Workspace`,
      slug: `ws-${user.id.substring(0, 8)}`,
      role: "OWNER",
      planTier: "FREE",
    };

    // Issue JWT token
    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      workspaceId: workspace.id,
      role: workspace.role,
      planTier: workspace.planTier,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          role: workspace.role,
          planTier: workspace.planTier,
        },
      },
      message: "Signed in successfully.",
    });

    response.headers.set("Set-Cookie", createSessionCookie(token));
    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "LOGIN_FAILED",
          message: error?.message || "Failed to sign in. Please try again.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
