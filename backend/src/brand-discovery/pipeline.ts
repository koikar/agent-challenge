import FirecrawlApp from "@mendable/firecrawl-js";

import {
  startAsyncBrandPipeline,
  startAsyncBrandExtraction,
} from "../services/async-jobs";

/**
 * Complete unified brand discovery pipeline
 */
export async function processUnifiedBrandDiscovery(
  domain: string,
  supabase: any,
  firecrawl: FirecrawlApp,
  env: Env,
) {
  try {
    console.log(
      `🚀 [Pipeline] STARTING UNIFIED BRAND DISCOVERY FOR: ${domain}`,
    );
    console.log(
      `🔧 [Pipeline] Environment check - URL: ${env.URL}, API Key present: ${!!env.FIRECRAWL_API_KEY}`,
    );

    // Step 1: Start async brand extraction (fast, cron will handle completion)
    console.log(
      `📡 [Pipeline] Step 1: Starting async brand extraction for ${domain}`,
    );

    const extractJobId = await startAsyncBrandExtraction(domain, firecrawl);

    if (!extractJobId) {
      console.error(
        `❌ [Pipeline] CRITICAL: Failed to start brand extraction for ${domain}`,
      );
      return { success: false, error: "Failed to start brand extraction" };
    }

    console.log(
      `✅ [Pipeline] Brand extraction job started: ${extractJobId} (cron will process completion)`,
    );

    // Create placeholder brand record (cron will enhance with extracted data)
    const placeholderBrand = {
      name:
        domain.split(".")[0].charAt(0).toUpperCase() +
        domain.split(".")[0].slice(1),
      description: `Extracting brand information from ${domain}...`,
      logo_url: `https://logo.clearbit.com/${domain}`,
      industry: "Analyzing...",
    };

    // Step 2: Create placeholder brand record (cron will enhance with extracted data)
    console.log(`[Pipeline] Step 2: Creating placeholder brand record`);

    // First, try to find existing playground brand for this domain
    const { data: existingBrand } = await supabase
      .from("brands")
      .select("*")
      .eq("primary_domain", domain)
      .eq("is_public", true)
      .is("owner_id", null) // Playground brands have null owner_id
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let brand;
    if (existingBrand) {
      // Update existing playground brand with placeholder info (cron will enhance)
      console.log(
        `[Pipeline] Updating existing playground brand: ${existingBrand.id}`,
      );
      const { data: updatedBrand, error: updateError } = await supabase
        .from("brands")
        .update({
          name: placeholderBrand.name,
          description: placeholderBrand.description,
          logo_url: placeholderBrand.logo_url,
          metadata: {
            ...placeholderBrand,
            extractJobId,
            worker_processed: true,
            playground_scan: true,
          },
          crawl_status: "extracting",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBrand.id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error(
          `[Pipeline] Update error for brand ${existingBrand.id}:`,
          updateError,
        );
        brand = null;
      } else {
        brand = updatedBrand;
      }
    }

    // Create new brand if no existing brand or update failed
    if (!brand) {
      console.log(`[Pipeline] Creating new placeholder brand for: ${domain}`);
      const { data: newBrand, error: createError } = await supabase
        .from("brands")
        .insert({
          owner_id: null,
          primary_domain: domain,
          name: placeholderBrand.name,
          description: placeholderBrand.description,
          logo_url: placeholderBrand.logo_url,
          metadata: {
            ...placeholderBrand,
            extractJobId,
            worker_processed: true,
            playground_scan: true,
          },
          crawl_status: "extracting",
          is_public: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;
      brand = newBrand;
    }

    if (!brand) {
      return {
        success: false,
        error: "Failed to create/update brand record",
      };
    }

    // Step 3: Create progress tracking
    console.log(
      `📋 [Pipeline] Step 3: Creating/updating progress tracking for brand ${brand.id}`,
    );

    const { data: mapping, error: mappingError } = await supabase
      .from("playground_url_mappings")
      .upsert(
        {
          brand_id: brand.id,
          domain: domain,
          status: "processing",
          progress_percentage: 30,
          current_step: "Worker processing - Discovering URLs...",
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "brand_id,domain",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (mappingError) {
      console.error(
        `❌ [Pipeline] Failed to create/update mapping:`,
        mappingError,
      );
      return { success: false, error: "Failed to create progress tracking" };
    }

    console.log(`✅ [Pipeline] Progress tracking created:`, mapping?.id);

    // Step 4: Start async Firecrawl pipeline with webhooks
    if (mapping?.id) {
      const webhookUrl = `${env.URL}/webhook/firecrawl`;

      console.log(
        `[Pipeline] Starting async pipeline with webhook: ${webhookUrl}`,
      );

      const asyncResult = await startAsyncBrandPipeline(
        {
          brandId: brand.id,
          domain,
          mappingId: mapping.id,
          webhookUrl,
        },
        firecrawl,
        supabase,
      );

      if (asyncResult.error) {
        console.error(
          `❌ [Pipeline] CRITICAL: Failed to start async pipeline for ${domain}:`,
          asyncResult.error,
        );
        // Update mapping status to failed
        await supabase
          .from("playground_url_mappings")
          .update({
            status: "failed",
            error_message: asyncResult.error,
          })
          .eq("id", mapping.id);
      } else {
        console.log(`🎉 [Pipeline] Async pipeline started successfully!`);
        console.log(`📋 [Pipeline] Jobs created:`, {
          extractJobId,
          batchJobId: asyncResult.batchJobId,
          mappingId: mapping.id,
        });

        // Extract completion will be handled by cron job
        if (extractJobId) {
          console.log(
            `⏰ [Pipeline] Extract job ${extractJobId} will be processed by cron`,
          );
        }
      }
    }

    console.log(
      `🎯 [Pipeline] PIPELINE COMPLETED for ${domain} - returning response`,
    );

    return {
      success: true,
      brand,
      mapping,
      scrapingResult: placeholderBrand, // Return placeholder, cron will enhance
      extractJobId,
    };
  } catch (error) {
    console.error(
      `🚨 [Pipeline] CRITICAL ERROR in pipeline for ${domain}:`,
      error,
    );

    // Provide more specific error messages
    let errorMessage = "Brand discovery pipeline failed";
    if (error instanceof Error) {
      if (error.message.includes("PGRST116")) {
        errorMessage = "Database record not found - created new brand instead";
      } else if (error.message.includes("extract")) {
        errorMessage = "Failed to extract brand information from website";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
