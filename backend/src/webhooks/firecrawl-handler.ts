/**
 * Firecrawl Webhook Handler
 * Processes real-time events from Firecrawl operations
 */

import { createClient } from "@supabase/supabase-js";

export interface FirecrawlWebhookEvent {
  success: boolean;
  type: string; // "crawl.page" | "batch_scrape.page" | "extract.completed" | etc.
  id: string; // Firecrawl job ID
  data: any[];
  metadata: {
    brandId?: string;
    domain?: string;
    mappingId?: string;
    [key: string]: any;
  };
  error?: string;
}

/**
 * Process Firecrawl webhook events and update database accordingly
 */
export async function handleFirecrawlWebhook(
  event: FirecrawlWebhookEvent,
  env: Env,
): Promise<Response> {
  try {
    console.log(
      `🎯 [Webhook] RECEIVED EVENT: ${event.type} for job ${event.id}`,
    );
    console.log(
      `📋 [Webhook] Event metadata:`,
      JSON.stringify(event.metadata, null, 2),
    );

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const { brandId, domain, mappingId } = event.metadata;

    if (!brandId || !domain) {
      console.warn(
        `[Webhook] Missing brandId/domain in metadata for ${event.id}`,
      );
      return new Response("OK", { status: 200 });
    }

    switch (event.type) {
      case "crawl.started":
      case "batch_scrape.started":
        return handleJobStarted(event, supabase, env);

      case "crawl.page":
      case "batch_scrape.page":
        return handlePageScraped(event, supabase, env);

      case "crawl.completed":
      case "batch_scrape.completed":
        return handleJobCompleted(event, supabase, env);

      case "extract.completed":
        return handleExtractCompleted(event, supabase, env);

      case "crawl.failed":
      case "batch_scrape.failed":
      case "extract.failed":
        return handleJobFailed(event, supabase, env);

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
        return new Response("OK", { status: 200 });
    }
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

/**
 * Handle job started events
 */
async function handleJobStarted(
  event: FirecrawlWebhookEvent,
  supabase: any,
  env: Env,
): Promise<Response> {
  const { brandId, mappingId } = event.metadata;

  console.log(`[Webhook] Job started for brand ${brandId}`);

  if (mappingId) {
    await supabase
      .from("playground_url_mappings")
      .update({
        status: "scraping_content",
        progress_percentage: 50,
        current_step: `Firecrawl job started (${event.id})`,
      })
      .eq("id", mappingId);
  }

  return new Response("OK", { status: 200 });
}

/**
 * Handle individual page scraped events
 */
async function handlePageScraped(
  event: FirecrawlWebhookEvent,
  supabase: any,
  env: Env,
): Promise<Response> {
  const { brandId } = event.metadata;

  if (!event.data || event.data.length === 0) {
    return new Response("OK", { status: 200 });
  }

  const page = event.data[0];
  const url = page.metadata?.sourceURL || page.metadata?.url;

  if (!url) {
    console.warn("[Webhook] No URL found in page data");
    return new Response("OK", { status: 200 });
  }

  console.log(`[Webhook] Page scraped: ${url}`);

  // Update URL status to scraped
  await supabase
    .from("brand_urls")
    .update({
      status: "scraped",
      scraped_at: new Date().toISOString(),
      image_count: (page.images || []).length,
      content_size: page.markdown?.length || 0,
    })
    .eq("brand_id", brandId)
    .eq("url", url);

  // Start R2 upload for this page
  await uploadPageToR2(page, brandId, event.metadata.domain, env);

  return new Response("OK", { status: 200 });
}

/**
 * Handle job completion events
 */
async function handleJobCompleted(
  event: FirecrawlWebhookEvent,
  supabase: any,
  env: Env,
): Promise<Response> {
  const { brandId, mappingId } = event.metadata;

  console.log(`[Webhook] Job completed for brand ${brandId}`);

  // Get final counts
  const { data: urlStats } = await supabase
    .from("brand_urls")
    .select("status")
    .eq("brand_id", brandId);

  const statusCounts =
    urlStats?.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  if (mappingId) {
    await supabase
      .from("playground_url_mappings")
      .update({
        status: "completed",
        progress_percentage: 100,
        current_step: `✅ ${statusCounts.uploaded || 0} pages uploaded to AI Search! (${statusCounts.failed || 0} failed)`,
        completed_at: new Date().toISOString(),
      })
      .eq("id", mappingId);
  }

  return new Response("OK", { status: 200 });
}

/**
 * Handle extract completion (for Step 1 brand data)
 */
async function handleExtractCompleted(
  event: FirecrawlWebhookEvent,
  supabase: any,
  env: Env,
): Promise<Response> {
  const { domain, jobType } = event.metadata;

  if (jobType === "brandExtraction" && event.data && event.data.length > 0) {
    const extractedData = event.data[0]?.data || {};

    console.log(
      `[Webhook] Brand extraction completed for ${domain}:`,
      extractedData,
    );

    // Update brand record with rich extracted data
    const brandName =
      extractedData.company_name ||
      domain.split(".")[0].charAt(0).toUpperCase() +
        domain.split(".")[0].slice(1);

    const { error } = await supabase
      .from("brands")
      .update({
        name: brandName,
        description:
          extractedData.description ||
          `Official website and services from ${brandName}.`,
        logo_url:
          extractedData.logo_url || `https://logo.clearbit.com/${domain}`,
        metadata: {
          ...extractedData,
          industry: extractedData.industry || "Various",
          worker_processed: true,
          playground_scan: true,
          extractCompletedAt: new Date().toISOString(),
        },
        crawl_status: "processing", // Move to URL discovery phase
        updated_at: new Date().toISOString(),
      })
      .eq("primary_domain", domain)
      .eq("is_public", true)
      .is("owner_id", null);

    if (error) {
      console.error(
        `[Webhook] Error updating brand with extracted data:`,
        error,
      );
    } else {
      console.log(
        `[Webhook] ✅ Brand updated with rich extracted data for ${domain}`,
      );
    }
  }

  return new Response("OK", { status: 200 });
}

/**
 * Handle job failure events
 */
async function handleJobFailed(
  event: FirecrawlWebhookEvent,
  supabase: any,
  env: Env,
): Promise<Response> {
  const { brandId, mappingId } = event.metadata;

  console.error(`[Webhook] Job failed for brand ${brandId}:`, event.error);

  if (mappingId) {
    await supabase
      .from("playground_url_mappings")
      .update({
        status: "failed",
        error_message: event.error || "Firecrawl job failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", mappingId);
  }

  // Mark any pending URLs as failed
  await supabase
    .from("brand_urls")
    .update({
      status: "failed",
      error_message: event.error || "Job failed",
    })
    .eq("brand_id", brandId)
    .in("status", ["discovered", "scraping"]);

  return new Response("OK", { status: 200 });
}

/**
 * Upload individual page to R2 as webhook receives it
 */
async function uploadPageToR2(
  page: any,
  brandId: string,
  domain: string,
  env: Env,
): Promise<void> {
  try {
    const url = page.metadata?.sourceURL || page.metadata?.url;

    // Mark as uploading
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    await supabase
      .from("brand_urls")
      .update({
        status: "uploading",
        uploading_started_at: new Date().toISOString(),
      })
      .eq("brand_id", brandId)
      .eq("url", url);

    // Use existing R2 uploader
    const { R2ContentUploader } = await import("../mcp/r2-upload-handler");
    const uploader = new R2ContentUploader(env.BRAND_CONTENT_BUCKET);

    const uploadResult = await uploader.uploadBrandContent({
      brandId,
      domain,
      content: [
        {
          url,
          title: page.metadata?.title || "Untitled",
          content: page.markdown || "",
          processed_content: page.markdown?.substring(0, 5000) || "",
          contentType: categorizeContentType(url),
          images: page.images || [],
        },
      ],
      options: { overwrite: true, generateMetadata: true },
    });

    // Mark as uploaded or failed
    if (uploadResult.success && uploadResult.results[0]?.success) {
      await supabase
        .from("brand_urls")
        .update({
          status: "uploaded",
          uploaded_at: new Date().toISOString(),
          r2_key: uploadResult.results[0].r2Key,
          content_size: uploadResult.results[0].size || 0,
        })
        .eq("brand_id", brandId)
        .eq("url", url);

      console.log(`[Webhook] ✅ Uploaded page to R2: ${url}`);
    } else {
      await supabase
        .from("brand_urls")
        .update({
          status: "failed",
          error_message: uploadResult.results[0]?.error || "R2 upload failed",
        })
        .eq("brand_id", brandId)
        .eq("url", url);

      console.log(`[Webhook] ❌ Failed to upload page: ${url}`);
    }
  } catch (error) {
    console.error(
      `[Webhook] Error uploading page ${page.metadata?.sourceURL}:`,
      error,
    );
  }
}

/**
 * Categorize content type for folder organization
 */
function categorizeContentType(url: string): string {
  try {
    const path = new URL(url).pathname.toLowerCase();

    if (path.includes("/blog") || path.includes("/news")) return "blog";
    if (path.includes("/docs") || path.includes("/documentation"))
      return "docs";
    if (path.includes("/about") || path.includes("/company")) return "about";
    if (path.includes("/product") || path.includes("/shop")) return "product";
    if (path === "/" || path === "/home") return "landing";

    return "other";
  } catch {
    return "pages";
  }
}
