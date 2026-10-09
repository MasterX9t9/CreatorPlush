import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Fallback in-memory cache for development if local database is not yet booted
// but production paths always invoke PostgreSQL via Prisma
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceSlug = searchParams.get("workspace") || "default";

  try {
    // Find or create default workspace for development
    let workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Default Workspace",
          slug: workspaceSlug,
        },
      });
    }

    const items = await prisma.swipeItem.findMany({
      where: {
        workspaceId: workspace.id,
      },
      include: {
        tags: true,
        folder: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: items,
      metadata: {
        source: "internal_calculation",
        dataType: "official",
        timestamp: new Date().toISOString(),
        confidence: 1.0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message:
            error?.message ||
            "PostgreSQL database query failed. Ensure DATABASE_URL is configured.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, itemType, externalId, thumbnailUrl, url, notes, tags, workspaceSlug = "default" } = body;

    if (!title || !itemType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Title and itemType are required fields.",
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    let workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Default Workspace",
          slug: workspaceSlug,
        },
      });
    }

    const createdItem = await prisma.swipeItem.create({
      data: {
        workspaceId: workspace.id,
        title,
        itemType,
        externalId: externalId || null,
        thumbnailUrl: thumbnailUrl || null,
        url: url || null,
        notes: notes || null,
        tags: {
          create: (tags || []).map((t: string) => ({ name: t })),
        },
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: createdItem,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DATABASE_INSERT_FAILED",
          message: error?.message || "Failed to persist swipe item.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_ID",
          message: "Item ID is required for deletion.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  try {
    await prisma.swipeItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { deletedId: id },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: error?.message || "Could not delete item.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
