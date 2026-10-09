import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  try {
    const whereClause: any = {};
    if (workspaceId) whereClause.workspaceId = workspaceId;
    if (unreadOnly) whereClause.isRead = false;

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DB_ERROR",
          message: error?.message || "Failed to retrieve notifications",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
