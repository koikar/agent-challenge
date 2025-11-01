/**
 * R2 Upload Handler for Brand Content Pipeline
 * Handles batch uploads of brand content to R2 with proper folder structure
 */

export interface R2UploadRequest {
  brandId: string;
  domain: string;
  content?: Array<{
    url: string;
    title: string;
    content: string;
    processed_content?: string;
    contentType?: string;
    images?: string[]; // Product image URLs from Firecrawl
  }>;
  // Removed: Direct URLs - Use Firecrawl batch scraping instead
  options?: {
    overwrite?: boolean;
    generateMetadata?: boolean;
    skipSupabaseStorage?: boolean; // New: Skip duplicate storage
  };
}

export interface R2UploadResponse {
  success: boolean;
  brandId: string;
  domain: string;
  results: Array<{
    url: string;
    r2Key: string;
    success: boolean;
    size?: number;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalSize: number;
  };
}

export class R2ContentUploader {
  private r2Bucket: R2Bucket;

  constructor(r2Bucket: R2Bucket) {
    this.r2Bucket = r2Bucket;
  }

  /**
   * Upload brand content to R2 with multitenancy folder structure
   * Supports both pre-scraped content and direct URLs for worker-side scraping
   */
  async uploadBrandContent(
    request: R2UploadRequest,
  ): Promise<R2UploadResponse> {
    const response: R2UploadResponse = {
      success: false,
      brandId: request.brandId,
      domain: request.domain,
      results: [],
      summary: {
        total: request.content.length,
        successful: 0,
        failed: 0,
        totalSize: 0,
      },
    };

    if (!request.content || request.content.length === 0) {
      console.warn(`[R2Upload] No content provided for ${request.domain}`);
      return response;
    }

    const brandPrefix = this.getBrandR2Prefix(request.domain);

    try {
      // Process Firecrawl content in parallel batches
      const BATCH_SIZE = 5;

      for (let i = 0; i < request.content.length; i += BATCH_SIZE) {
        const batch = request.content.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(async (contentItem, batchIndex) => {
          const globalIndex = i + batchIndex;
          return this.uploadSingleContent(
            brandPrefix,
            contentItem,
            globalIndex,
            request.options,
          );
        });

        const batchResults = await Promise.allSettled(batchPromises);

        // Process batch results
        batchResults.forEach((result, batchIndex) => {
          const contentItem = batch[batchIndex];

          if (result.status === "fulfilled" && result.value.success) {
            response.results.push(result.value);
            response.summary.successful++;
            response.summary.totalSize += result.value.size || 0;
          } else {
            const error =
              result.status === "rejected"
                ? result.reason?.message || "Upload failed"
                : result.value.error || "Unknown error";

            response.results.push({
              url: contentItem.url,
              r2Key: "",
              success: false,
              error,
            });
            response.summary.failed++;
          }
        });

        // Small delay between batches to avoid overwhelming R2
        if (i + BATCH_SIZE < request.content.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      response.success = response.summary.successful > 0;

      console.log(
        `[R2Upload] Completed upload for ${request.domain}: ${response.summary.successful}/${response.summary.total} successful`,
      );

      return response;
    } catch (error) {
      console.error(
        `[R2Upload] Error uploading content for ${request.domain}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Upload single content item to R2
   */
  private async uploadSingleContent(
    brandPrefix: string,
    contentItem: any,
    index: number,
    options?: R2UploadRequest["options"],
  ): Promise<{
    url: string;
    r2Key: string;
    success: boolean;
    size?: number;
    error?: string;
  }> {
    try {
      const r2Key = this.generateR2Key(brandPrefix, contentItem.url, index);

      // Check if file exists (unless overwrite is enabled)
      if (!options?.overwrite) {
        const existing = await this.r2Bucket.head(r2Key);
        if (existing) {
          return {
            url: contentItem.url,
            r2Key,
            success: true,
            size: existing.size,
          };
        }
      }

      // Format content as markdown
      const markdownContent = this.formatAsMarkdown(contentItem, index);
      const contentBuffer = new TextEncoder().encode(markdownContent);

      // Prepare metadata
      const metadata: Record<string, string> = {
        "original-url": contentItem.url,
        "content-type": contentItem.contentType || "page",
        "uploaded-at": new Date().toISOString(),
        "brand-prefix": brandPrefix,
      };

      if (contentItem.title) {
        metadata["title"] = contentItem.title;
      }

      // Upload to R2
      await this.r2Bucket.put(r2Key, contentBuffer, {
        httpMetadata: {
          contentType: "text/markdown",
          contentEncoding: "utf-8",
        },
        customMetadata: metadata,
      });

      return {
        url: contentItem.url,
        r2Key,
        success: true,
        size: contentBuffer.length,
      };
    } catch (error) {
      console.error(`[R2Upload] Failed to upload ${contentItem.url}:`, error);
      return {
        url: contentItem.url,
        r2Key: "",
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Generate R2 key following multitenancy folder structure
   */
  private generateR2Key(
    brandPrefix: string,
    url: string,
    index: number,
  ): string {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split("/").filter(Boolean);

      // Create descriptive filename
      let filename =
        pathSegments.length > 0
          ? pathSegments[pathSegments.length - 1]
          : "index";

      // Remove file extension if present, add .md
      filename = filename.replace(/\.[^/.]+$/, "");
      filename = filename || `page-${index}`;

      // Sanitize filename for R2
      filename = filename
        .replace(/[^a-zA-Z0-9\-_]/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-|-$/g, "");

      // Create hierarchical structure
      const contentType = this.categorizeContent(url, pathSegments);
      const timestamp = Date.now();

      return `${brandPrefix}/content/${contentType}/${filename}-${timestamp}.md`;
    } catch (error) {
      // Fallback for invalid URLs
      return `${brandPrefix}/content/pages/page-${index}-${Date.now()}.md`;
    }
  }

  /**
   * Categorize content based on URL patterns for folder organization
   */
  private categorizeContent(url: string, pathSegments: string[]): string {
    const path = pathSegments.join("/").toLowerCase();

    if (
      path.includes("product") ||
      path.includes("model") ||
      path.includes("car")
    )
      return "products";
    if (
      path.includes("news") ||
      path.includes("blog") ||
      path.includes("article")
    )
      return "news";
    if (
      path.includes("about") ||
      path.includes("company") ||
      path.includes("history")
    )
      return "about";
    if (
      path.includes("service") ||
      path.includes("support") ||
      path.includes("maintenance")
    )
      return "services";
    if (
      path.includes("contact") ||
      path.includes("location") ||
      path.includes("dealer")
    )
      return "contact";
    if (
      path.includes("gallery") ||
      path.includes("image") ||
      path.includes("media")
    )
      return "media";

    return "pages";
  }

  /**
   * Get brand-specific R2 prefix for multitenancy
   */
  private getBrandR2Prefix(domain: string): string {
    const normalizedDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .toLowerCase();

    return `brands/${normalizedDomain}`;
  }

  /**
   * Format extracted content as markdown for R2 storage
   */
  private formatAsMarkdown(contentItem: any, index: number): string {
    const timestamp = new Date().toISOString();
    const imageSection =
      contentItem.images && contentItem.images.length > 0
        ? `\n## Product Images\n${contentItem.images.map((img: string, i: number) => `![Product Image ${i + 1}](${img})`).join("\n")}\n`
        : "";

    return `---
title: ${contentItem.title || "Untitled"}
url: ${contentItem.url}
extracted_at: ${timestamp}
content_type: ${contentItem.contentType || "page"}
index: ${index}
images: ${JSON.stringify(contentItem.images || [])}
---

# ${contentItem.title || "Untitled"}

**Source URL:** [${contentItem.url}](${contentItem.url})
**Extracted:** ${timestamp}
**Content Type:** ${contentItem.contentType || "page"}
${contentItem.images?.length ? `**Images Found:** ${contentItem.images.length}` : ""}
${imageSection}
## Content

${contentItem.processed_content || contentItem.content || "No content available"}

---

*Content extracted and processed by Tedix Brand Pipeline*
*Stored with multitenancy isolation in R2*
`;
  }

  /**
   * List content for a specific brand (useful for debugging)
   */
  async listBrandContent(domain: string, prefix?: string): Promise<R2Object[]> {
    const brandPrefix = this.getBrandR2Prefix(domain);
    const listPrefix = prefix ? `${brandPrefix}/${prefix}` : `${brandPrefix}/`;

    const objects = await this.r2Bucket.list({ prefix: listPrefix });
    return objects.objects;
  }

  /**
   * Delete brand content (useful for reprocessing)
   */
  async deleteBrandContent(domain: string, prefix?: string): Promise<void> {
    const objects = await this.listBrandContent(domain, prefix);

    if (objects.length === 0) {
      console.log(`[R2Upload] No content found for deletion: ${domain}`);
      return;
    }

    // Delete in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < objects.length; i += BATCH_SIZE) {
      const batch = objects.slice(i, i + BATCH_SIZE);
      const deletePromises = batch.map((obj) => this.r2Bucket.delete(obj.key));
      await Promise.allSettled(deletePromises);
    }

    console.log(`[R2Upload] Deleted ${objects.length} objects for ${domain}`);
  }
}
