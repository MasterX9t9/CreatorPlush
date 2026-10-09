import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { userRepository } from "@/lib/repositories/user-repository";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({
        success: true,
        data: {
          authenticated: false,
          user: null,
          workspace: null,
        },
      });
    }

    // Attempt to load fresh workspace data
    const freshProfile = await userRepository.getUserWithWorkspace(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: freshProfile?.user.name || session.user.name || session.user.email.split("@")[0],
          avatarUrl: freshProfile?.user.avatarUrl,
        },
        workspace: {
          id: freshProfile?.workspace.id || session.workspace.id,
          name: freshProfile?.workspace.name || "Default Workspace",
          slug: freshProfile?.workspace.slug || "default",
          role: freshProfile?.workspace.role || session.workspace.role,
          planTier: freshProfile?.workspace.planTier || session.workspace.planTier,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SESSION_CHECK_ERROR",
          message: error?.message || "Failed to verify session.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
