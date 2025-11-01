import { createUIResource } from "@mcp-ui/server";
import FirecrawlApp from "@mendable/firecrawl-js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createClient } from "@supabase/supabase-js";
import { McpAgent } from "agents/mcp";
import { withX402 } from "agents/x402";
import { z } from "zod";
import { createMainUI } from "./mcp/ui";
import { createBrandSearchHTML } from "./mcp/ui/templates/brand-search";
import { createBrandSelectorHTML } from "./mcp/ui/templates/brand-selector";
import { BrandDataService, type BrandData } from "./services/brand-data";
import { handleBrandDiscovery } from "./brand-discovery/handler";
import { R2ContentUploader } from "./mcp/r2-upload-handler";
import { handleFirecrawlWebhook } from "./webhooks/firecrawl-handler";
import { verifyWebhookSignature, parseFirecrawlEvent } from "./webhooks/verify";

const X402_CONFIG = {
  network: "base-sepolia",
  recipient: process.env.MCP_ADDRESS as `0x${string}`,
  facilitator: { url: "https://x402.org/facilitator" },
};

export class TedixMCP extends McpAgent<Env> {
  server = withX402(
    new McpServer({ name: "TedixMCP", version: "1.0.0" }),
    X402_CONFIG,
  );
  currentBrand: BrandData | null = null;

  async init() {
    // Load default brand (nosana.io for demo)
    try {
      this.currentBrand = await BrandDataService.getBrandByDomain(
        "nosana.io",
        this.env,
      );
      console.log(
        `🎯 Loaded default brand: ${this.currentBrand?.name || "none"}`,
      );
    } catch (error) {
      console.warn("Failed to load default brand:", error);
      // Fallback to any available brand
      try {
        const allBrands = await BrandDataService.getAllBrands(this.env);
        if (allBrands.length > 0) {
          this.currentBrand = allBrands[0];
          console.log(`🎯 Fallback to first available brand: ${this.currentBrand.name}`);
        }
      } catch (fallbackError) {
        console.warn("Failed to load fallback brand:", fallbackError);
      }
    }
    // Brand selector tool
    this.server.tool(
      "show-brand-selector",
      "Show available brands for selection",
      {},
      async () => {
        try {
          const brands = await BrandDataService.getAllBrands(this.env);
          const selectorHTML = createBrandSelectorHTML(brands);

          const selectorResource = createUIResource({
            uri: `ui://brand-selector/brands-${Date.now()}`,
            content: { type: "rawHtml", htmlString: selectorHTML },
            encoding: "blob",
            metadata: {
              title: "Select Brand - Tedix",
              description: "Choose a brand to interact with",
              author: "Tedix Platform",
              preferredRenderContext: "inline",
            },
            uiMetadata: {
              "preferred-frame-size": ["800px", "600px"],
            },
          });

          return {
            content: [
              {
                type: "text",
                text: `Found ${brands.length} available brands`,
              },
              selectorResource,
            ],
          };
        } catch (error) {
          console.error("Error loading brands:", error);
          return {
            content: [
              {
                type: "text",
                text: "Failed to load brands. Please try again.",
              },
            ],
          };
        }
      },
    );

    // Switch brand tool
    this.server.tool(
      "switch-brand",
      "Switch to a different brand",
      { brandSlug: z.string().describe("Slug of the brand to switch to") },
      async ({ brandSlug }: { brandSlug: string }) => {
        try {
          const brand = await BrandDataService.getBrandBySlug(brandSlug, this.env);
          if (!brand) {
            return {
              content: [
                {
                  type: "text",
                  text: `Brand with slug "${brandSlug}" not found.`,
                },
              ],
            };
          }

          this.currentBrand = brand;
          console.log(`🔄 Switched to brand: ${brand.name}`);

          return {
            content: [
              {
                type: "text",
                text: `Switched to ${brand.name}. You can now search their content and browse products.`,
              },
            ],
          };
        } catch (error) {
          console.error("Error switching brand:", error);
          return {
            content: [
              {
                type: "text",
                text: "Failed to switch brand. Please try again.",
              },
            ],
          };
        }
      },
    );


    // Dynamic brand search tool
    this.server.tool(
      "ai-search",
      "Search current brand information and content",
      {
        query: z
          .string()
          .describe(
            "Search query about the current brand, products, or services",
          ),
      },
      async ({ query }: any) => {
        try {
          console.log(`🔍 AI Search query: "${query}"`);

          // First, try to detect which brand this query is about
          let targetBrand = this.currentBrand;
          const allBrands = await BrandDataService.getAllBrands(this.env);

          console.log(
            `🔍 Available brands:`,
            allBrands.map((b) => b.name),
          );
          console.log(`🔍 Query: "${query}"`);

          // Check if the query mentions a specific brand
          const queryLower = query.toLowerCase();
          console.log(`🔍 Query to match: "${queryLower}"`);
          
          for (const brand of allBrands) {
            const brandKeywords = [
              brand.name.toLowerCase(),
              brand.primary_domain.toLowerCase().replace(/\.(com|io|ai|org|net)$/, ""),
              brand.slug.toLowerCase(),
            ];

            console.log(
              `🔍 Checking brand ${brand.name} with keywords:`,
              brandKeywords,
            );

            // Check if any keyword is found in the query
            const matchedKeyword = brandKeywords.find((keyword) =>
              queryLower.includes(keyword)
            );

            if (matchedKeyword) {
              targetBrand = brand;
              console.log(`🎯 Detected query is about ${brand.name} (${brand.primary_domain})`);
              console.log(`🎯 Matched keyword: "${matchedKeyword}"`);
              console.log(`🎯 Brand logo URL: ${BrandDataService.getBrandLogoUrl(brand)}`);
              break;
            }
          }

          console.log(`🎯 Final target brand: ${targetBrand?.name || "none"}`);
          console.log(
            `🎯 Default current brand: ${this.currentBrand?.name || "none"}`,
          );

          const brandName = targetBrand?.name || "Brand";

          // Use the real AutoRAG API for dynamic search results
          const response = await this.env.AI.autorag(
            "still-bush-0e04",
          ).aiSearch({
            query: query.trim(),
            max_num_results: 5,
            rewrite_query: true,
          });

          console.log(`✅ AI Search response received:`, response);

          // Extract the text response from the AutoRAG result
          const aiAnswer =
            response && typeof response === "string"
              ? response
              : response && response.response
                ? response.response
                : `No specific information found for "${query}". Please try a more general query.`;

          console.log(`📝 Using AI answer:`, aiAnswer);

          const searchHTML = createBrandSearchHTML(
            query,
            aiAnswer,
            targetBrand || undefined,
          );

          const searchResource = createUIResource({
            uri: `ui://${brandName.toLowerCase()}-info/brand-${Date.now()}`,
            content: { type: "rawHtml", htmlString: searchHTML },
            encoding: "blob",
            metadata: {
              title: `${brandName} Brand Information`,
              description: "Official company information and services",
              author: "Tedix Platform",
              preferredRenderContext: "inline",
            },
            uiMetadata: {
              "preferred-frame-size": ["700px", "600px"],
            },
          });

          return {
            content: [
              {
                type: "text",
                text: `${brandName} brand information - view detailed company profile below`,
              },
              searchResource,
            ],
          };
        } catch (error) {
          console.error("AI Search error:", error);

          // Fallback to current brand description from database
          const brandName = this.currentBrand?.name || "Brand";
          const brandDomain =
            this.currentBrand?.primary_domain || "example.com";
          const fallbackInfo =
            this.currentBrand?.description ||
            `${brandName} is a company that provides various products and services. Visit ${brandDomain} for more information.`;

          const searchHTML = createBrandSearchHTML(
            query,
            fallbackInfo,
            this.currentBrand || undefined,
          );

          const searchResource = createUIResource({
            uri: `ui://${brandName.toLowerCase()}-info/brand-fallback-${Date.now()}`,
            content: { type: "rawHtml", htmlString: searchHTML },
            encoding: "blob",
            metadata: {
              title: `${brandName} Brand Information`,
              description: "Official company information and services",
              author: "Tedix Platform",
              preferredRenderContext: "inline",
            },
            uiMetadata: {
              "preferred-frame-size": ["700px", "600px"],
            },
          });

          return {
            content: [
              {
                type: "text",
                text: `Search unavailable - showing general ${brandName} information`,
              },
              searchResource,
            ],
          };
        }
      },
    );
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      return TedixMCP.serve("/mcp").fetch(request, env, ctx);
    } else if (
      url.pathname === "/brand-discovery" &&
      request.method === "POST"
    ) {
      // Handle brand discovery pipeline for playground
      return handleBrandDiscovery(request, env);
    } else if (
      url.pathname === "/webhook/firecrawl" &&
      request.method === "POST"
    ) {
      // Handle Firecrawl webhook events for real-time progress
      return handleWebhook(request, env);
    } else if (
      url.pathname === "/upload-brand-content" &&
      request.method === "POST"
    ) {
      // Handle R2 content upload
      return handleR2Upload(request, env);
    } else if (
      url.pathname === "/cleanup-r2" &&
      request.method === "POST"
    ) {
      // Handle R2 bucket cleanup
      return handleR2Cleanup(request, env);
    }

    // Get current brand data for UI customization
    let brandData: BrandData | null = null;
    try {
      brandData = await BrandDataService.getBrandByDomain(
        "nosana.io",
        env,
      );
    } catch (error) {
      console.warn("Failed to load brand data for UI:", error);
      // Fallback to any available brand
      try {
        const allBrands = await BrandDataService.getAllBrands(env);
        if (allBrands.length > 0) {
          brandData = allBrands[0];
        }
      } catch (fallbackError) {
        console.warn("Failed to load fallback brand for UI:", fallbackError);
      }
    }

    const brandName = brandData?.name;
    const brandLogo = brandData
      ? BrandDataService.getBrandLogoUrl(brandData)
      : undefined;

    const dynamicUI = createMainUI(brandName, brandLogo);

    return new Response(dynamicUI, {
      headers: { "Content-Type": "text/html" },
    });
  },

  // Cron job to process pending extract jobs every minute
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log(
      `🕒 [Cron] Processing pending extract jobs at ${new Date().toISOString()}`,
    );

    ctx.waitUntil(processPendingExtractJobs(env));
  },
};

/**
 * Handle Firecrawl webhook events
 */
async function handleWebhook(request: Request, env: Env): Promise<Response> {
  try {
    console.log(
      "[Webhook] 🎯 Received Firecrawl webhook from:",
      request.headers.get("User-Agent"),
    );
    console.log(
      "[Webhook] Request headers:",
      Object.fromEntries(request.headers.entries()),
    );

    // Verify webhook signature for security
    const webhookSecret = env.FIRECRAWL_WEBHOOK_SECRET || env.FIRECRAWL_API_KEY;
    const { isValid, body } = await verifyWebhookSignature(
      request,
      webhookSecret,
    );

    if (!isValid) {
      console.warn("[Webhook] Invalid signature, rejecting request");
      return new Response("Unauthorized", { status: 401 });
    }

    // Parse webhook event
    const event = parseFirecrawlEvent(body);
    if (!event) {
      console.warn("[Webhook] Invalid event format");
      return new Response("Bad Request", { status: 400 });
    }

    // Process the webhook event
    return await handleFirecrawlWebhook(event, env);
  } catch (error) {
    console.error("[Webhook] Error handling webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * Handle R2 content upload
 */
async function handleR2Upload(request: Request, env: Env): Promise<Response> {
  try {
    const uploadRequest = await request.json();

    if (
      !uploadRequest.brandId ||
      !uploadRequest.domain ||
      !uploadRequest.content
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: brandId, domain, content",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const uploader = new R2ContentUploader(env.BRAND_CONTENT_BUCKET);
    const result = await uploader.uploadBrandContent(uploadRequest);

    console.log(
      `[R2Upload] Processed ${result.summary.total} items for ${uploadRequest.domain}: ${result.summary.successful} successful, ${result.summary.failed} failed`,
    );

    return new Response(
      JSON.stringify({
        success: result.success,
        summary: result.summary,
        results: result.results,
        aiSearchInfo: {
          bucket: env.R2_BUCKET_NAME || "brands",
          folderStructure: `brands/${uploadRequest.domain}/content/`,
          autoIndexing: "AI Search will automatically index new content",
          estimatedTime: "1-5 minutes for indexing to complete",
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[R2Upload] Upload error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

/**
 * Handle R2 bucket cleanup - keep only specified brands
 */
async function handleR2Cleanup(request: Request, env: Env): Promise<Response> {
  try {
    const cleanupRequest = await request.json();
    const brandsToKeep = cleanupRequest.brandsToKeep || ["nosana.io", "mastra"];
    
    console.log(`🧹 [R2Cleanup] Starting cleanup, keeping brands: ${brandsToKeep.join(", ")}`);
    
    const bucket = env.BRAND_CONTENT_BUCKET;
    const deletedFolders: string[] = [];
    const errors: string[] = [];
    
    // List all objects in the bucket with the "brands/" prefix
    const listResult = await bucket.list({ prefix: "brands/" });
    
    if (!listResult.objects || listResult.objects.length === 0) {
      console.log("🧹 [R2Cleanup] No objects found in bucket");
      return new Response(JSON.stringify({
        success: true,
        message: "No objects found in bucket",
        deletedFolders: [],
        errors: []
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Group objects by brand folder
    const brandFolders = new Set<string>();
    for (const obj of listResult.objects) {
      // Extract brand folder from path like "brands/example.com/content/..."
      const pathParts = obj.key.split("/");
      if (pathParts.length >= 2 && pathParts[0] === "brands") {
        brandFolders.add(pathParts[1]);
      }
    }
    
    console.log(`🧹 [R2Cleanup] Found brand folders: ${Array.from(brandFolders).join(", ")}`);
    
    // Delete objects from brands not in the keep list
    for (const brandFolder of brandFolders) {
      if (!brandsToKeep.includes(brandFolder)) {
        console.log(`🗑️ [R2Cleanup] Deleting brand folder: ${brandFolder}`);
        
        try {
          // List all objects for this brand
          const brandObjects = await bucket.list({ prefix: `brands/${brandFolder}/` });
          
          if (brandObjects.objects && brandObjects.objects.length > 0) {
            // Delete all objects in this brand folder
            const deletePromises = brandObjects.objects.map(obj => 
              bucket.delete(obj.key).catch(error => {
                console.error(`❌ Failed to delete ${obj.key}:`, error);
                return { error: `Failed to delete ${obj.key}` };
              })
            );
            
            await Promise.all(deletePromises);
            deletedFolders.push(brandFolder);
            console.log(`✅ [R2Cleanup] Deleted ${brandObjects.objects.length} objects from ${brandFolder}`);
          }
        } catch (error) {
          const errorMsg = `Failed to delete brand folder ${brandFolder}: ${error}`;
          console.error(`❌ [R2Cleanup] ${errorMsg}`);
          errors.push(errorMsg);
        }
      } else {
        console.log(`✅ [R2Cleanup] Keeping brand folder: ${brandFolder}`);
      }
    }
    
    console.log(`🎉 [R2Cleanup] Cleanup completed. Deleted: ${deletedFolders.length} folders, Errors: ${errors.length}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Cleanup completed successfully`,
      brandsKept: brandsToKeep,
      deletedFolders,
      errors,
      summary: {
        totalBrandFolders: brandFolders.size,
        deleted: deletedFolders.length,
        kept: brandsToKeep.filter(brand => brandFolders.has(brand)).length,
        errors: errors.length
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("[R2Cleanup] Cleanup error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Cleanup failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Process pending extract jobs (called by cron every minute)
 */
async function processPendingExtractJobs(env: Env): Promise<void> {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

    // Find brands with extracting status that have extract job IDs
    const { data: pendingBrands } = await supabase
      .from("brands")
      .select("id, primary_domain, metadata")
      .eq("crawl_status", "extracting")
      .not("metadata->extractJobId", "is", null)
      .order("created_at", { ascending: true })
      .limit(10); // Process up to 10 pending extracts per minute

    if (!pendingBrands || pendingBrands.length === 0) {
      console.log(`📭 [Cron] No pending extract jobs to process`);
      return;
    }

    console.log(
      `🔄 [Cron] Processing ${pendingBrands.length} pending extract jobs`,
    );

    for (const brand of pendingBrands) {
      const domain = brand.primary_domain;
      const extractJobId = brand.metadata?.extractJobId;

      if (!extractJobId) {
        console.warn(`⚠️ [Cron] Brand ${domain} missing extractJobId`);
        continue;
      }

      try {
        console.log(
          `📊 [Cron] Checking extract job ${extractJobId} for ${domain}`,
        );

        const extractStatus = await firecrawl.getExtractStatus(extractJobId);

        if (extractStatus.status === "completed") {
          console.log(
            `✅ [Cron] Extract completed for ${domain}, updating brand data`,
          );

          const extractedData = extractStatus.data || {};
          const brandName =
            extractedData.company_name ||
            domain.split(".")[0].charAt(0).toUpperCase() +
              domain.split(".")[0].slice(1);

          await supabase
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
                industry: extractedData.industry || "Technology",
                extractCompletedAt: new Date().toISOString(),
                cronProcessed: true,
              },
              crawl_status: "processing",
              updated_at: new Date().toISOString(),
            })
            .eq("id", brand.id);

          console.log(
            `🎉 [Cron] Brand ${domain} enhanced with: ${brandName}, ${extractedData.industry}`,
          );
        } else if (extractStatus.status === "failed") {
          console.error(
            `❌ [Cron] Extract failed for ${domain}, marking as failed`,
          );

          await supabase
            .from("brands")
            .update({
              crawl_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", brand.id);
        } else {
          console.log(
            `⏳ [Cron] Extract still processing for ${domain}: ${extractStatus.status}`,
          );
        }
      } catch (error) {
        console.error(
          `🚨 [Cron] Error processing extract for ${domain}:`,
          error,
        );
      }
    }

    console.log(`✅ [Cron] Finished processing pending extract jobs`);
  } catch (error) {
    console.error(`🚨 [Cron] Error in cron job:`, error);
  }
}
