/**
 * Advanced Content Processing System for Large-Scale Brands
 * Handles content chunking, multimedia detection, and optimization for Apps SDK
 */

import type { Database } from "@/lib/database.types";

type ContentType = Database["public"]["Enums"]["brand_content_type"];

export interface MultimediaAsset {
  type: "image" | "video" | "audio" | "document" | "embed";
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  duration?: number; // for videos/audio
  fileSize?: number;
  mimeType?: string;
}

export interface ContentChunk {
  id: string;
  type: "text" | "code" | "table" | "list" | "header" | "multimedia";
  content: string;
  metadata: {
    section?: string;
    subsection?: string;
    level?: number;
    language?: string; // for code blocks
    multimedia?: MultimediaAsset[];
  };
  searchableText: string; // Optimized for AI search
  aiSummary?: string; // AI-generated summary for large chunks
}

export interface ProcessedContent {
  originalUrl: string;
  title: string;
  contentType: ContentType;
  totalLength: number;
  chunks: ContentChunk[];
  multimedia: MultimediaAsset[];
  structure: {
    headings: Array<{
      level: number;
      text: string;
      id: string;
    }>;
    sections: Array<{
      title: string;
      chunkIds: string[];
    }>;
  };
  metadata: {
    estimatedReadTime: number;
    complexity: "simple" | "moderate" | "complex";
    lastModified?: string;
    author?: string;
    tags?: string[];
  };
}

/**
 * Advanced content processor with chunking and multimedia detection
 */
export class ContentProcessor {
  private readonly MAX_CHUNK_SIZE = 2000; // characters
  private readonly MAX_API_SPEC_CHUNK = 5000; // larger for API specs
  private readonly IMAGE_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
  ];
  private readonly VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
  private readonly AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a"];

  /**
   * Process raw content into optimized chunks with multimedia detection
   */
  async processContent(
    url: string,
    rawContent: string,
    contentType: ContentType,
    title?: string,
  ): Promise<ProcessedContent> {
    // Detect and extract multimedia
    const multimedia = this.extractMultimedia(rawContent);

    // Clean content for processing
    const cleanedContent = this.cleanContent(rawContent);

    // Determine chunking strategy based on content type
    const chunkSize = this.getOptimalChunkSize(
      contentType,
      cleanedContent.length,
    );

    // Parse structure (headings, sections)
    const structure = this.parseContentStructure(cleanedContent);

    // Create chunks based on content type
    const chunks = await this.createIntelligentChunks(
      cleanedContent,
      contentType,
      structure,
      chunkSize,
    );

    // Calculate metadata
    const metadata = this.calculateMetadata(cleanedContent, contentType);

    return {
      originalUrl: url,
      title: title || this.extractTitle(cleanedContent) || "Untitled",
      contentType,
      totalLength: cleanedContent.length,
      chunks,
      multimedia,
      structure,
      metadata,
    };
  }

  /**
   * Extract multimedia assets from content
   */
  private extractMultimedia(content: string): MultimediaAsset[] {
    const multimedia: MultimediaAsset[] = [];

    // Extract images
    const imageRegex =
      /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
    let imageMatch;
    while ((imageMatch = imageRegex.exec(content)) !== null) {
      multimedia.push({
        type: "image",
        url: imageMatch[1],
        alt: imageMatch[2] || undefined,
      });
    }

    // Extract videos
    const videoRegex =
      /<video[^>]+src=["']([^"']+)["'][^>]*>|<source[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let videoMatch;
    while ((videoMatch = videoRegex.exec(content)) !== null) {
      multimedia.push({
        type: "video",
        url: videoMatch[1] || videoMatch[2],
      });
    }

    // Extract embedded content (YouTube, Vimeo, etc.)
    const embedRegex =
      /<iframe[^>]+src=["']([^"']*(?:youtube|vimeo|loom)[^"']*)["'][^>]*>/gi;
    let embedMatch;
    while ((embedMatch = embedRegex.exec(content)) !== null) {
      multimedia.push({
        type: "embed",
        url: embedMatch[1],
      });
    }

    // Extract linked assets
    const linkRegex =
      /<a[^>]+href=["']([^"']+\.(jpg|jpeg|png|gif|mp4|pdf|doc|docx))["'][^>]*>([^<]*)<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      const ext = linkMatch[2].toLowerCase();
      let type: MultimediaAsset["type"] = "document";
      if (this.IMAGE_EXTENSIONS.includes(`.${ext}`)) type = "image";
      else if (this.VIDEO_EXTENSIONS.includes(`.${ext}`)) type = "video";

      multimedia.push({
        type,
        url: linkMatch[1],
        caption: linkMatch[3] || undefined,
      });
    }

    return multimedia;
  }

  /**
   * Clean and normalize content for processing
   */
  private cleanContent(content: string): string {
    return (
      content
        // Remove scripts and styles
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        // Remove navigation and footer elements
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        // Remove ads and tracking
        .replace(
          /<div[^>]*(?:ad|advertisement|tracking)[^>]*>[\s\S]*?<\/div>/gi,
          "",
        )
        // Normalize whitespace
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  /**
   * Parse content structure (headings, sections)
   */
  private parseContentStructure(content: string) {
    const headings: Array<{ level: number; text: string; id: string }> = [];
    const sections: Array<{ title: string; chunkIds: string[] }> = [];

    // Extract headings
    const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
    let headingMatch;
    let currentSection: { title: string; chunkIds: string[] } | null = null;

    while ((headingMatch = headingRegex.exec(content)) !== null) {
      const level = parseInt(headingMatch[1]);
      const text = headingMatch[2].trim();
      const id = this.generateId(text);

      headings.push({ level, text, id });

      // Create sections for h1 and h2
      if (level <= 2) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: text, chunkIds: [] };
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return { headings, sections };
  }

  /**
   * Create intelligent chunks based on content type
   */
  private async createIntelligentChunks(
    content: string,
    contentType: ContentType,
    structure: any,
    chunkSize: number,
  ): Promise<ContentChunk[]> {
    const chunks: ContentChunk[] = [];

    switch (contentType) {
      case "docs":
      case "tutorial":
      case "guide":
        return this.chunkDocumentation(content, structure, chunkSize);

      case "blog":
      case "news":
        return this.chunkBlogContent(content, chunkSize);

      case "support":
        return this.chunkSupportContent(content, chunkSize);

      default:
        return this.chunkGenericContent(content, chunkSize);
    }
  }

  /**
   * Specialized chunking for documentation
   */
  private chunkDocumentation(
    content: string,
    structure: any,
    chunkSize: number,
  ): ContentChunk[] {
    const chunks: ContentChunk[] = [];

    // Split by sections first
    const sections = content.split(/<h[1-3][^>]*>/gi);

    sections.forEach((section, index) => {
      if (!section.trim()) return;

      // Extract code blocks
      const codeBlocks = this.extractCodeBlocks(section);
      let processedSection = section;

      // Remove code blocks temporarily
      codeBlocks.forEach((block, blockIndex) => {
        processedSection = processedSection.replace(
          block.content,
          `__CODE_BLOCK_${blockIndex}__`,
        );
      });

      // Chunk the text content
      const textChunks = this.splitIntoChunks(processedSection, chunkSize);

      textChunks.forEach((chunk, chunkIndex) => {
        let finalContent = chunk;

        // Restore code blocks
        codeBlocks.forEach((block, blockIndex) => {
          finalContent = finalContent.replace(
            `__CODE_BLOCK_${blockIndex}__`,
            block.content,
          );
        });

        const heading = structure.headings.find((h: any) =>
          finalContent.includes(h.text),
        );

        chunks.push({
          id: `doc_${index}_${chunkIndex}`,
          type: codeBlocks.length > 0 ? "code" : "text",
          content: finalContent,
          metadata: {
            section: heading?.text,
            level: heading?.level,
            language: this.detectCodeLanguage(finalContent),
          },
          searchableText: this.extractSearchableText(finalContent),
        });
      });
    });

    return chunks;
  }

  /**
   * Specialized chunking for blog content
   */
  private chunkBlogContent(content: string, chunkSize: number): ContentChunk[] {
    // Split by paragraphs and preserve structure
    const paragraphs = content.split(/\n\s*\n/);
    const chunks: ContentChunk[] = [];
    let currentChunk = "";
    let chunkIndex = 0;

    paragraphs.forEach((paragraph) => {
      if (
        currentChunk.length + paragraph.length > chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push({
          id: `blog_${chunkIndex}`,
          type: "text",
          content: currentChunk.trim(),
          metadata: {},
          searchableText: this.extractSearchableText(currentChunk),
        });
        currentChunk = paragraph;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    });

    if (currentChunk.trim()) {
      chunks.push({
        id: `blog_${chunkIndex}`,
        type: "text",
        content: currentChunk.trim(),
        metadata: {},
        searchableText: this.extractSearchableText(currentChunk),
      });
    }

    return chunks;
  }

  /**
   * Specialized chunking for support content
   */
  private chunkSupportContent(
    content: string,
    chunkSize: number,
  ): ContentChunk[] {
    // Split by FAQ items or support sections
    const faqRegex =
      /(?:^|\n)(?:\d+\.|Q:|Question:|Problem:)(.*?)(?=\n(?:\d+\.|Q:|Question:|Problem:)|$)/gis;
    const faqMatches = Array.from(content.matchAll(faqRegex));

    if (faqMatches.length > 0) {
      return faqMatches.map((match, index) => ({
        id: `faq_${index}`,
        type: "text",
        content: match[0].trim(),
        metadata: {
          section: "FAQ",
        },
        searchableText: this.extractSearchableText(match[0]),
      }));
    }

    return this.chunkGenericContent(content, chunkSize);
  }

  /**
   * Generic content chunking
   */
  private chunkGenericContent(
    content: string,
    chunkSize: number,
  ): ContentChunk[] {
    const chunks = this.splitIntoChunks(content, chunkSize);

    return chunks.map((chunk, index) => ({
      id: `chunk_${index}`,
      type: "text",
      content: chunk,
      metadata: {},
      searchableText: this.extractSearchableText(chunk),
    }));
  }

  /**
   * Helper methods
   */
  private getOptimalChunkSize(
    contentType: ContentType,
    contentLength: number,
  ): number {
    // API documentation and technical content can be larger
    if (contentType === "docs" && contentLength > 50000) {
      return this.MAX_API_SPEC_CHUNK;
    }

    return this.MAX_CHUNK_SIZE;
  }

  private extractCodeBlocks(
    content: string,
  ): Array<{ content: string; language?: string }> {
    const codeBlocks: Array<{ content: string; language?: string }> = [];
    const codeRegex =
      /<pre[^>]*><code[^>]*(?:class="language-(\w+)")?[^>]*>([\s\S]*?)<\/code><\/pre>/gi;

    let match;
    while ((match = codeRegex.exec(content)) !== null) {
      codeBlocks.push({
        content: match[0],
        language: match[1],
      });
    }

    return codeBlocks;
  }

  private detectCodeLanguage(content: string): string | undefined {
    const langRegex = /class="language-(\w+)"/i;
    const match = content.match(langRegex);
    return match ? match[1] : undefined;
  }

  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = "";

    sentences.forEach((sentence) => {
      if (
        currentChunk.length + sentence.length > chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ". " : "") + sentence;
      }
    });

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private extractSearchableText(content: string): string {
    return content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private extractTitle(content: string): string | null {
    const titleRegex = /<h1[^>]*>([^<]+)<\/h1>/i;
    const match = content.match(titleRegex);
    return match ? match[1].trim() : null;
  }

  private generateId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
  }

  private calculateMetadata(content: string, contentType: ContentType) {
    const wordCount = content.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 WPM

    let complexity: "simple" | "moderate" | "complex" = "simple";
    if (wordCount > 5000 || contentType === "docs") complexity = "complex";
    else if (wordCount > 1000) complexity = "moderate";

    return {
      estimatedReadTime,
      complexity,
    };
  }
}

export const contentProcessor = new ContentProcessor();
