/**
 * Async Job Service for Firecrawl Operations
 * Handles starting async jobs with webhook callbacks
 */

import FirecrawlApp from "@mendable/firecrawl-js";
import {
  categorizeUrls,
  selectTopUrls,
} from "../brand-discovery/url-processor";

/**
 * Start async brand extraction (fast, no waiting)
 */
export async function startAsyncBrandExtraction(
  domain: string,
  firecrawl: FirecrawlApp,
): Promise<string | null> {
  try {
    console.log(`🏗️ [Async Extract] STARTING BRAND EXTRACTION for ${domain}`);
    console.log(
      `🔑 [Async Extract] Firecrawl client initialized: ${!!firecrawl}`,
    );

    // Start extract job without webhooks (cron will handle completion)
    const extractJob = await firecrawl.startExtract({
      urls: [`https://${domain}`],
      prompt:
        "Extract comprehensive brand information including company name, description, industry, logo URL, contact details, pricing, and main products.",
      schema: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          description: { type: "string" },
          industry: { type: "string" },
          logo_url: { type: "string" },
          contact_email: { type: "string" },
          phone_number: { type: "string" },
          address: { type: "string" },
          pricing_info: { type: "string" },
          main_product: { type: "string" },
        },
        required: ["company_name", "description"],
      },
    });

    if (!extractJob.success) {
      console.error(
        `❌ [Async Extract] FAILED to start extract job for ${domain}:`,
        extractJob,
      );
      return null;
    }

    console.log(
      `✅ [Async Extract] Extract job started successfully: ${extractJob.id}`,
    );
    return extractJob.id;
  } catch (error) {
    console.error(
      `🚨 [Async Extract] EXCEPTION starting extract job for ${domain}:`,
      error,
    );
    return null;
  }
}

export interface AsyncJobConfig {
  brandId: string;
  domain: string;
  mappingId: string;
  webhookUrl: string;
}

/**
 * Start async Map + BatchScrape pipeline with webhooks
 */
export async function startAsyncBrandPipeline(
  config: AsyncJobConfig,
  firecrawl: FirecrawlApp,
  supabase: any,
): Promise<{ mapJobId?: string; batchJobId?: string; error?: string }> {
  try {
    const baseUrl = `https://${config.domain}`;
    console.log(
      `🚀 [Async Jobs] STARTING ASYNC BRAND PIPELINE for ${config.domain}`,
    );
    console.log(`📋 [Async Jobs] Config:`, JSON.stringify(config, null, 2));

    // Step 1: Start Map operation to discover URLs
    console.log(`🗺️ [Async Jobs] Step 1: Starting Map job for ${baseUrl}`);

    // First do a quick synchronous map to get URLs immediately
    const mapResult = await firecrawl.map(baseUrl, {
      limit: 30,
      includeSubdomains: true,
      sitemap: "include",
    });

    console.log(`📊 [Async Jobs] Map result:`, {
      success: !!mapResult,
      linksFound: mapResult?.links?.length || 0,
      hasError: !!mapResult.error,
    });

    if (!mapResult.links || mapResult.links.length === 0) {
      console.error(
        `❌ [Async Jobs] No URLs discovered during mapping for ${baseUrl}`,
      );
      return { error: "No URLs discovered during mapping" };
    }

    console.log(
      `✅ [Async Jobs] Map completed: ${mapResult.links.length} URLs discovered`,
    );
    console.log(
      `🔗 [Async Jobs] Sample URLs:`,
      mapResult.links.slice(0, 3).map((l) => l.url),
    );

    // Step 2: Store discovered URLs in database
    await storeDiscoveredUrls(mapResult.links, config, supabase);

    // Step 3: Select top URLs and start async batch scrape with webhook
    const categorizedUrls = categorizeUrls(mapResult.links);
    const selectedUrls = selectTopUrls(categorizedUrls, 8);

    console.log(
      `🔥 [Async Jobs] Step 3: Starting BatchScrape for ${selectedUrls.length} selected URLs`,
    );
    console.log(
      `🎯 [Async Jobs] Selected URLs for scraping:`,
      selectedUrls.map((l) => l.url),
    );

    // Use startBatchScrape for webhook-based processing
    const batchScrapeConfig = {
      options: {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
        maxAge: 3600000, // 1 hour cache for 500% faster scraping
        blockAds: true,
        removeBase64Images: true,
        proxy: "auto",
      },
      maxConcurrency: 5, // Limit concurrent requests to avoid overwhelming
      ignoreInvalidURLs: true, // Don't fail entire batch on invalid URLs
      webhook: {
        url: config.webhookUrl,
        metadata: {
          brandId: config.brandId,
          domain: config.domain,
          mappingId: config.mappingId,
        },
        events: ["started", "page", "completed", "failed"],
      },
    };

    console.log(
      `⚙️ [Async Jobs] BatchScrape config:`,
      JSON.stringify(batchScrapeConfig, null, 2),
    );

    const batchScrapeJob = await firecrawl.startBatchScrape(
      selectedUrls.map((link: any) => link.url),
      batchScrapeConfig,
    );

    console.log(
      `📤 [Async Jobs] BatchScrape response:`,
      JSON.stringify(batchScrapeJob, null, 2),
    );

    // Check if job was created successfully (presence of job ID indicates success)
    if (!batchScrapeJob.id) {
      console.error(
        `❌ [Async Jobs] FAILED to start BatchScrape job - no job ID returned:`,
        batchScrapeJob,
      );
      return {
        error: `BatchScrape failed: ${batchScrapeJob.error || "No job ID returned"}`,
      };
    }

    console.log(
      `✅ [Async Jobs] BatchScrape job started successfully: ${batchScrapeJob.id}`,
    );

    return {
      batchJobId: batchScrapeJob.id,
    };
  } catch (error) {
    console.error("[Async Jobs] Error starting async pipeline:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to start async pipeline",
    };
  }
}

/**
 * Store discovered URLs in database for tracking
 */
async function storeDiscoveredUrls(
  links: any[],
  config: AsyncJobConfig,
  supabase: any,
): Promise<void> {
  try {
    const categorizedUrls = categorizeUrls(links);

    // Prepare URL records for batch insert
    const urlRecords = Object.entries(categorizedUrls).flatMap(
      ([category, urls]: [string, any[]]) =>
        urls.map((link: any) => ({
          brand_id: config.brandId,
          mapping_id: config.mappingId,
          url: link.url,
          title: link.title || null,
          description: link.description || null,
          category,
          priority: link.priority || 0,
          status: "discovered",
        })),
    );

    if (urlRecords.length > 0) {
      const { error } = await supabase.from("brand_urls").upsert(urlRecords, {
        onConflict: "brand_id,url",
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(`[Async Jobs] Error storing URLs:`, error);
      } else {
        console.log(
          `[Async Jobs] ✅ Stored ${urlRecords.length} URLs for real-time tracking`,
        );
      }
    }

    // Update mapping with category counts
    const categoryCounts = {
      company: categorizedUrls.company?.length || 0,
      blog: categorizedUrls.blog?.length || 0,
      docs: categorizedUrls.docs?.length || 0,
      ecommerce: categorizedUrls.ecommerce?.length || 0,
      other: categorizedUrls.other?.length || 0,
    };

    await supabase
      .from("playground_url_mappings")
      .update({
        status: "mapping_urls",
        progress_percentage: 40,
        current_step: `Discovered ${links.length} URLs, starting async scraping...`,
        urls_discovered: links.length,
        company_info_count: categoryCounts.company,
        blog_count: categoryCounts.blog,
        docs_count: categoryCounts.docs,
        ecommerce_count: categoryCounts.ecommerce,
        total_urls: links.length,
      })
      .eq("id", config.mappingId);

    console.log(`[Async Jobs] 📊 Category breakdown:`, categoryCounts);
  } catch (error) {
    console.error("[Async Jobs] Error storing discovered URLs:", error);
    throw error;
  }
}
