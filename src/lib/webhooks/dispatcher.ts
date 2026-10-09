import crypto from "crypto";
import { prisma } from "@/lib/db";
import { generateHmacSignature } from "@/lib/crypto";

export interface WebhookDeliveryResult {
  webhookId: string;
  url: string;
  status: number;
  success: boolean;
  error?: string;
}

/**
 * Dispatches an event payload to registered active webhook endpoints with HMAC-SHA256 signatures.
 */
export async function dispatchWebhookEvent(
  event: string,
  payload: Record<string, any>,
  workspaceId?: string
): Promise<WebhookDeliveryResult[]> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      isActive: true,
      workspaceId: workspaceId || undefined,
    },
  });

  const matchingWebhooks = webhooks.filter(
    (wh) => wh.events.includes(event) || wh.events.includes("*")
  );

  const results: WebhookDeliveryResult[] = [];
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyString = JSON.stringify({
    event,
    timestamp,
    data: payload,
  });

  for (const wh of matchingWebhooks) {
    const signature = generateHmacSignature(bodyString, wh.secretKey);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CreatorPulse-Event": event,
          "X-CreatorPulse-Timestamp": timestamp,
          "X-CreatorPulse-Signature": signature,
          "User-Agent": "CreatorPulse-Webhook-Dispatcher/1.0",
        },
        body: bodyString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      results.push({
        webhookId: wh.id,
        url: wh.url,
        status: res.status,
        success: res.ok,
      });
    } catch (err: any) {
      results.push({
        webhookId: wh.id,
        url: wh.url,
        status: 0,
        success: false,
        error: err?.message || "Connection failed or timed out",
      });
    }
  }

  return results;
}
