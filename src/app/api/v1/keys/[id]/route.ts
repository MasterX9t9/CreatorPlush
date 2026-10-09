import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const keyId = params.id;

  if (!keyId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_KEY_ID",
          message: "The key ID parameter is required.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "KEY_NOT_FOUND",
            message: `API key with ID '${keyId}' does not exist.`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    return NextResponse.json({
      success: true,
      message: `API key '${existing.name}' has been permanently revoked.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REVOKE_KEY_FAILED",
          message: error?.message || "Failed to revoke API key",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
