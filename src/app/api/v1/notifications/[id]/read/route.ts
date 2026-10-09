import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const notificationId = params.id;

  try {
    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOTIFICATION_NOT_FOUND",
            message: `Notification with ID '${notificationId}' not found.`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: error?.message || "Failed to mark notification as read",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
