import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/repositories/user-repository";
import { signAuthToken } from "@/lib/auth/jwt";
import { createSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { z } from "zod";

const SignupSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(100, "Password cannot exceed 100 characters."),
  name: z.string().min(1, "Name is required.").max(60).optional(),
});

export async function POST(request: NextRequest) {
  // 1. Rate limiting (max 10 signup attempts per minute per IP)
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`signup_${clientIp}`, 10, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: `Too many signup attempts. Please try again in ${rateLimit.resetSeconds} seconds.`,
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
    const validated = SignupSchema.safeParse(body);

    if (!validated.success) {
      const issue = validated.error.issues[0]?.message || "Invalid registration data.";
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: issue,
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validated.data;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_ALREADY_EXISTS",
            message: "An account with this email address already exists. Please log in instead.",
            status: 409,
          },
        },
        { status: 409 }
      );
    }

    // Create user and default workspace
    const { user, workspace } = await userRepository.createUser({
      email,
      password,
      name,
    });

    // Issue JWT authentication token
    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      workspaceId: workspace.id,
      role: workspace.role,
      planTier: workspace.planTier,
    });

    const response = NextResponse.json(
      {
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
        message: "Account created successfully.",
      },
      { status: 201 }
    );

    // Set secure HttpOnly session cookie
    response.headers.set("Set-Cookie", createSessionCookie(token));
    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SIGNUP_FAILED",
          message: error?.message || "Failed to create account. Please try again.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
