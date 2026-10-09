import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { PlanTier } from "@prisma/client";

/**
 * Validates Stripe signature header conforming to Stripe's v1 HMAC-SHA256 specification
 */
function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  try {
    const parts = header.split(",");
    let timestamp = "";
    let signature = "";

    for (const part of parts) {
      const [k, v] = part.split("=");
      if (k === "t") timestamp = v;
      if (k === "v1") signature = v;
    }

    if (!timestamp || !signature) return false;

    // Tolerance check: 5 minutes (300 seconds)
    const now = Math.floor(Date.now() / 1000);
    const eventTime = parseInt(timestamp, 10);
    if (Math.abs(now - eventTime) > 300) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNCONFIGURED_WEBHOOK_SECRET",
          message: "STRIPE_WEBHOOK_SECRET is unconfigured in the environment. Set this variable to verify live Stripe webhooks.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }

  const signatureHeader = request.headers.get("stripe-signature");
  if (!signatureHeader) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_STRIPE_SIGNATURE",
          message: "Missing 'stripe-signature' header.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  const isValid = verifyStripeSignature(rawBody, signatureHeader, secret);

  if (!isValid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_SIGNATURE",
          message: "Stripe signature verification failed.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  try {
    const event = JSON.parse(rawBody);
    const eventType = event.type;
    const dataObject = event.data?.object;

    // Handle Subscription Updated or Created
    if (
      eventType === "customer.subscription.created" ||
      eventType === "customer.subscription.updated"
    ) {
      const customerId = dataObject.customer as string;
      const subscriptionId = dataObject.id as string;
      const status = dataObject.status as string; // "active", "past_due", "canceled"
      const metadata = dataObject.metadata || {};
      const workspaceId = metadata.workspaceId as string;

      // Extract price or tier mapping
      const priceId = dataObject.items?.data?.[0]?.price?.id as string;
      let tier: PlanTier = "CREATOR";
      if (metadata.tier) {
        tier = metadata.tier.toUpperCase() as PlanTier;
      }

      if (workspaceId) {
        await prisma.subscription.upsert({
          where: { workspaceId },
          create: {
            workspaceId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            tier,
            status,
            currentPeriodEnd: new Date(dataObject.current_period_end * 1000),
          },
          update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            tier,
            status,
            currentPeriodEnd: new Date(dataObject.current_period_end * 1000),
          },
        });
      }
    }

    // Handle Subscription Canceled
    if (eventType === "customer.subscription.deleted") {
      const subscriptionId = dataObject.id as string;
      const existingSub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            tier: "FREE",
            status: "canceled",
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "WEBHOOK_PROCESSING_ERROR",
          message: error?.message || "Failed to process Stripe webhook payload",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
