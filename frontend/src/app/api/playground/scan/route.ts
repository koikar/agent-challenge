import { type NextRequest, NextResponse } from "next/server";

// Request deduplication cache to prevent duplicate processing
const processingCache = new Map<string, Promise<any>>();

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 },
      );
    }

    const cleanDomain = normalizeUrl(domain);

    // Check if we're already processing this domain
    if (processingCache.has(cleanDomain)) {
      processingCache.delete(cleanDomain);
    }

    // Create processing promise and cache it
    const processingPromise = callWorkerBrandDiscovery(cleanDomain);
    processingCache.set(cleanDomain, processingPromise);

    try {
      const result = await processingPromise;
      return result;
    } finally {
      // Clean up cache after 30 seconds
      setTimeout(() => processingCache.delete(cleanDomain), 30000);
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Brand discovery failed",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * Call the worker's unified brand discovery pipeline
 */
async function callWorkerBrandDiscovery(domain: string) {
  try {
    const workerUrl = process.env.CLOUDFLARE_WORKER_URL;

    const response = await fetch(`${workerUrl}/brand-discovery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Playground] Worker call failed:", error);
    throw error;
  }
}

/**
 * URL normalization for playground requests
 */
function normalizeUrl(input: string): string {
  if (!input) return "";

  try {
    let decoded = decodeURIComponent(input);
    decoded = decoded.replace(/^https?:\/\//, "");
    decoded = decoded.replace(/^www\./, "");
    decoded = decoded.split("/")[0];
    decoded = decoded.split(":")[0];
    decoded = decoded.toLowerCase().trim();

    if (!decoded || !decoded.includes(".")) {
      throw new Error(`Invalid domain format: ${input}`);
    }

    console.log(`[Playground] URL normalized: "${input}" → "${decoded}"`);
    return decoded;
  } catch (error) {
    console.error(
      `[Playground] URL normalization failed for "${input}":`,
      error,
    );
    return input
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .toLowerCase()
      .trim();
  }
}
