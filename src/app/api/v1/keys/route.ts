import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateApiKey } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");

  try {
    const keys = await prisma.apiKey.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      select: {
        id: true,
        workspaceId: true,
        name: true,
        prefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: keys,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DB_ERROR",
          message: error?.message || "Failed to retrieve API keys",
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
    const { name, workspaceId, scopes = ["read:all"] } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_KEY_NAME",
            message: "A name for the API key is required.",
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

    const { rawKey, keyHash, keyPrefix } = generateApiKey("cp_live");

    const createdRecord = await prisma.apiKey.create({
      data: {
        workspaceId: wsId,
        name: name.trim(),
        keyHash,
        prefix: keyPrefix,
        scopes,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: createdRecord.id,
          name: createdRecord.name,
          prefix: createdRecord.prefix,
          scopes: createdRecord.scopes,
          createdAt: createdRecord.createdAt,
          // Raw key is only returned ONCE upon creation conforming to Rule 14
          rawKey,
          warning: "Make sure to copy your API key now. You will not be able to see it again.",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CREATE_KEY_FAILED",
          message: error?.message || "Failed to generate API key",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
