import { createClient } from "@supabase/supabase-js";
import FirecrawlApp from "@mendable/firecrawl-js";
import { processUnifiedBrandDiscovery } from "./pipeline";
import { normalizeUrl } from "./url-processor";

/**
 * Handle unified brand discovery pipeline in worker
 * Combines: Firecrawl Extract + Map + BatchScrape + R2 Upload + Progress Tracking
 */
export async function handleBrandDiscovery(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ success: false, error: "Domain is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Initialize services
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

    // URL normalization
    const cleanDomain = normalizeUrl(domain);
    console.log(`[Brand Discovery Handler] Processing: ${cleanDomain}`);

    // Start the unified pipeline
    const result = await processUnifiedBrandDiscovery(
      cleanDomain,
      supabase,
      firecrawl,
      env,
    );

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Brand Discovery Handler] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Brand discovery failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}