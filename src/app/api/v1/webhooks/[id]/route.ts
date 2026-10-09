import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateHmacSignature } from "@/lib/crypto";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const webhookId = params.id;

  try {
    const existing = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "WEBHOOK_NOT_FOUND",
            message: `Webhook with ID '${webhookId}' not found.`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    return NextResponse.json({
      success: true,
      message: "Webhook has been deleted.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: error?.message || "Failed to delete webhook",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}

// POST: Ping / test delivery to webhook
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const webhookId = params.id;

  try {
    const existing = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "WEBHOOK_NOT_FOUND",
            message: `Webhook with ID '${webhookId}' not found.`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const testPayload = JSON.stringify({
      event: "test.ping",
      timestamp,
      data: {
        message: "Test ping from CreatorPulse Webhook Engine",
        webhookId: existing.id,
      },
    });

    const signature = generateHmacSignature(testPayload, existing.secretKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const pingRes = await fetch(existing.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CreatorPulse-Event": "test.ping",
        "X-CreatorPulse-Timestamp": timestamp,
        "X-CreatorPulse-Signature": signature,
        "User-Agent": "CreatorPulse-Webhook-Tester/1.0",
      },
      body: testPayload,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return NextResponse.json({
      success: pingRes.ok,
      data: {
        statusCode: pingRes.status,
        statusText: pingRes.statusText,
        delivered: pingRes.ok,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PING_FAILED",
          message: error?.message || "Failed to deliver test ping to webhook URL",
          status: 502,
        },
      },
      { status: 502 }
    );
  }
}
