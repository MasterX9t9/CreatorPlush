import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");

  try {
    const webhooks = await prisma.webhook.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      select: {
        id: true,
        workspaceId: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: webhooks,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DB_ERROR",
          message: error?.message || "Failed to list webhooks",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url, events = ["*"], workspaceId } = body;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_URL",
            message: "A valid HTTP or HTTPS webhook URL is required.",
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    // Default or ensure workspace
    let wsId = workspaceId;
    if (!wsId) {
      const firstWs = await prisma.workspace.findFirst();
      if (!firstWs) {
        const createdWs = await prisma.workspace.create({
          data: {
            name: "Default Workspace",
            slug: "default-workspace",
          },
        });
        wsId = createdWs.id;
      } else {
        wsId = firstWs.id;
      }
    }

    const secretKey = `whsec_${crypto.randomBytes(24).toString("hex")}`;

    const created = await prisma.webhook.create({
      data: {
        workspaceId: wsId,
        url: url.trim(),
        secretKey,
        events: Array.isArray(events) ? events : [events],
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: created.id,
          url: created.url,
          events: created.events,
          secretKey,
          createdAt: created.createdAt,
          warning: "Store this webhook secret key securely to verify incoming X-CreatorPulse-Signature headers.",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CREATE_WEBHOOK_FAILED",
          message: error?.message || "Failed to register webhook",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
