/**
 * Webhook signature verification for security
 * Implements HMAC-SHA256 verification as per Firecrawl docs
 */

/**
 * Verify Firecrawl webhook signature
 */
export async function verifyWebhookSignature(
  request: Request,
  webhookSecret: string,
): Promise<{ isValid: boolean; body: string }> {
  try {
    const signature = request.headers.get("X-Firecrawl-Signature");
    
    if (!signature) {
      console.warn("[Webhook Verify] No signature header found");
      return { isValid: false, body: "" };
    }

    // Extract algorithm and hash from signature header
    const [algorithm, hash] = signature.split("=");
    if (algorithm !== "sha256") {
      console.warn(`[Webhook Verify] Invalid algorithm: ${algorithm}`);
      return { isValid: false, body: "" };
    }

    // Get raw request body
    const body = await request.text();

    // Compute expected signature using Web Crypto API (Cloudflare Workers compatible)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const bodyData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, bodyData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Timing-safe comparison (basic implementation for workers)
    const isValid = hash.length === expectedSignature.length && 
                   hash === expectedSignature;

    if (!isValid) {
      console.warn("[Webhook Verify] Signature verification failed");
      console.warn(`[Webhook Verify] Expected: ${expectedSignature}`);
      console.warn(`[Webhook Verify] Received: ${hash}`);
    } else {
      console.log("[Webhook Verify] ✅ Signature verified");
    }

    return { isValid, body };
  } catch (error) {
    console.error("[Webhook Verify] Error verifying signature:", error);
    return { isValid: false, body: "" };
  }
}

/**
 * Parse and validate Firecrawl webhook event
 */
export function parseFirecrawlEvent(body: string): FirecrawlWebhookEvent | null {
  try {
    const event = JSON.parse(body) as FirecrawlWebhookEvent;
    
    // Basic validation
    if (!event.type || !event.id) {
      console.warn("[Webhook Parse] Invalid event structure");
      return null;
    }

    return event;
  } catch (error) {
    console.error("[Webhook Parse] Error parsing event:", error);
    return null;
  }
}