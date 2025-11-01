/**
 * Specialized Content Renderers for Apps SDK
 * Optimized layouts for different content types (blog, docs, API specs, etc.)
 */

import { BookOpen, Calendar, Clock, Code, HelpCircle, Tag, User } from "lucide-react";
import React from "react";
import { ContentChunk, ProcessedContent } from "@/lib/content-processor";
import {
  AppsSdkAlert,
  AppsSdkBadge,
  AppsSdkCodeBlock,
  AppsSdkContainer,
  AppsSdkDivider,
  AppsSdkHeading,
  AppsSdkLink,
  AppsSdkList,
  AppsSdkTable,
  AppsSdkText,
} from "./base-components";
import { AppsSdkMultimedia } from "./multimedia-components";

/**
 * Blog Post Renderer - Optimized for article content
 */
export function BlogPostRenderer({
  content,
  brandName,
  brandColor,
}: {
  content: ProcessedContent;
  brandName?: string;
  brandColor?: string;
}) {
  const publishDate = content.metadata.lastModified
    ? new Date(content.metadata.lastModified)
    : null;

  return (
    <AppsSdkContainer brandName={brandName} brandColor={brandColor}>
      {/* Article Header */}
      <header className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <AppsSdkHeading level={1}>{content.title}</AppsSdkHeading>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-4">
          {publishDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {publishDate.toLocaleDateString()}
            </div>
          )}

          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {content.metadata.estimatedReadTime} min read
          </div>

          <AppsSdkBadge variant="secondary">{content.contentType}</AppsSdkBadge>
        </div>
      </header>

      {/* Article Content */}
      <article className="prose prose-gray dark:prose-invert max-w-none">
        {content.chunks.map((chunk, index) => (
          <div key={chunk.id} className="mb-6">
            {renderContentChunk(chunk, index)}
          </div>
        ))}
      </article>

      {/* Multimedia Gallery */}
      {content.multimedia.length > 0 && (
        <>
          <AppsSdkDivider />
          <section>
            <AppsSdkHeading level={3}>Media</AppsSdkHeading>
            <AppsSdkMultimedia assets={content.multimedia} />
          </section>
        </>
      )}
    </AppsSdkContainer>
  );
}

/**
 * Documentation Renderer - Optimized for technical documentation
 */
export function DocumentationRenderer({
  content,
  brandName,
  brandColor,
}: {
  content: ProcessedContent;
  brandName?: string;
  brandColor?: string;
}) {
  return (
    <AppsSdkContainer brandName={brandName} brandColor={brandColor}>
      {/* Documentation Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <AppsSdkBadge variant="default">Documentation</AppsSdkBadge>
          <AppsSdkBadge variant="secondary">{content.metadata.complexity}</AppsSdkBadge>
        </div>

        <AppsSdkHeading level={1}>{content.title}</AppsSdkHeading>

        {content.metadata.estimatedReadTime > 10 && (
          <AppsSdkAlert type="info" title="Long Read">
            This documentation is approximately {content.metadata.estimatedReadTime} minutes to
            read. Use the table of contents to navigate to specific sections.
          </AppsSdkAlert>
        )}
      </header>

      {/* Table of Contents */}
      {content.structure.headings.length > 3 && (
        <nav className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <AppsSdkHeading level={4}>Table of Contents</AppsSdkHeading>
          <div className="space-y-1">
            {content.structure.headings.map((heading, index) => (
              <div key={index} className={`text-sm ${heading.level > 2 ? "ml-4" : ""}`}>
                <AppsSdkLink href={`#${heading.id}`}>{heading.text}</AppsSdkLink>
              </div>
            ))}
          </div>
        </nav>
      )}

      {/* Documentation Content */}
      <div className="space-y-6">
        {content.chunks.map((chunk, index) => (
          <section key={chunk.id}>{renderContentChunk(chunk, index)}</section>
        ))}
      </div>

      {/* Code Examples Section */}
      {content.chunks.some((chunk) => chunk.type === "code") && (
        <>
          <AppsSdkDivider />
          <section>
            <AppsSdkHeading level={3}>
              <Code className="h-5 w-5 inline mr-2" />
              Code Examples
            </AppsSdkHeading>
            <div className="grid gap-4">
              {content.chunks
                .filter((chunk) => chunk.type === "code")
                .map((chunk, index) => (
                  <div key={chunk.id}>{renderContentChunk(chunk, index)}</div>
                ))}
            </div>
          </section>
        </>
      )}
    </AppsSdkContainer>
  );
}

/**
 * API Specification Renderer - Optimized for API documentation
 */
export function ApiSpecRenderer({
  content,
  brandName,
  brandColor,
}: {
  content: ProcessedContent;
  brandName?: string;
  brandColor?: string;
}) {
  const endpointChunks = content.chunks.filter(
    (chunk) =>
      chunk.metadata.section?.toLowerCase().includes("endpoint") ||
      chunk.content.includes("GET ") ||
      chunk.content.includes("POST ") ||
      chunk.content.includes("PUT ") ||
      chunk.content.includes("DELETE "),
  );

  return (
    <AppsSdkContainer brandName={brandName} brandColor={brandColor}>
      {/* API Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Code className="h-5 w-5 text-green-600" />
          <AppsSdkBadge variant="success">API Reference</AppsSdkBadge>
          <AppsSdkBadge variant="secondary">{endpointChunks.length} endpoints</AppsSdkBadge>
        </div>

        <AppsSdkHeading level={1}>{content.title}</AppsSdkHeading>
      </header>

      {/* Quick Reference */}
      {endpointChunks.length > 0 && (
        <section className="mb-8">
          <AppsSdkHeading level={3}>Quick Reference</AppsSdkHeading>
          <div className="grid gap-2">
            {endpointChunks.slice(0, 10).map((chunk, index) => {
              const method = extractHttpMethod(chunk.content);
              const endpoint = extractEndpoint(chunk.content);

              return (
                <div
                  key={chunk.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <AppsSdkBadge variant={getMethodColor(method)}>{method}</AppsSdkBadge>
                  <code className="text-sm">{endpoint}</code>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* API Content */}
      <div className="space-y-8">
        {content.chunks.map((chunk, index) => (
          <section key={chunk.id}>{renderContentChunk(chunk, index)}</section>
        ))}
      </div>
    </AppsSdkContainer>
  );
}

/**
 * Support/FAQ Renderer - Optimized for help content
 */
export function SupportRenderer({
  content,
  brandName,
  brandColor,
}: {
  content: ProcessedContent;
  brandName?: string;
  brandColor?: string;
}) {
  const faqChunks = content.chunks.filter(
    (chunk) =>
      chunk.metadata.section?.toLowerCase().includes("faq") ||
      chunk.content.toLowerCase().includes("question") ||
      chunk.content.toLowerCase().includes("problem"),
  );

  return (
    <AppsSdkContainer brandName={brandName} brandColor={brandColor}>
      {/* Support Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-purple-600" />
          <AppsSdkBadge variant="default">Support</AppsSdkBadge>
          {faqChunks.length > 0 && (
            <AppsSdkBadge variant="secondary">{faqChunks.length} FAQ items</AppsSdkBadge>
          )}
        </div>

        <AppsSdkHeading level={1}>{content.title}</AppsSdkHeading>
      </header>

      {/* Quick Search Alert */}
      <AppsSdkAlert type="info" title="Need help?">
        Search for specific terms or browse the sections below to find answers to common questions.
      </AppsSdkAlert>

      {/* FAQ Section */}
      {faqChunks.length > 0 && (
        <section className="mb-8">
          <AppsSdkHeading level={3}>Frequently Asked Questions</AppsSdkHeading>
          <div className="space-y-4">
            {faqChunks.map((chunk, index) => (
              <div
                key={chunk.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                {renderContentChunk(chunk, index)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Other Support Content */}
      <div className="space-y-6">
        {content.chunks
          .filter((chunk) => !faqChunks.includes(chunk))
          .map((chunk, index) => (
            <section key={chunk.id}>{renderContentChunk(chunk, index)}</section>
          ))}
      </div>
    </AppsSdkContainer>
  );
}

/**
 * Generic Content Renderer - For any content type
 */
export function GenericContentRenderer({
  content,
  brandName,
  brandColor,
}: {
  content: ProcessedContent;
  brandName?: string;
  brandColor?: string;
}) {
  return (
    <AppsSdkContainer brandName={brandName} brandColor={brandColor}>
      <header className="mb-8">
        <AppsSdkHeading level={1}>{content.title}</AppsSdkHeading>

        <div className="flex items-center gap-2 mt-4">
          <AppsSdkBadge variant="default">{content.contentType}</AppsSdkBadge>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {content.totalLength.toLocaleString()} characters
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {content.chunks.map((chunk, index) => (
          <div key={chunk.id}>{renderContentChunk(chunk, index)}</div>
        ))}
      </div>

      {content.multimedia.length > 0 && (
        <>
          <AppsSdkDivider />
          <AppsSdkMultimedia assets={content.multimedia} />
        </>
      )}
    </AppsSdkContainer>
  );
}

/**
 * Content Renderer Factory - Chooses the appropriate renderer
 */
export function ContentRenderer({
  content,
  brandName,
  brandColor,
}: {
  content: ProcessedContent;
  brandName?: string;
  brandColor?: string;
}) {
  switch (content.contentType) {
    case "blog":
    case "news":
      return <BlogPostRenderer content={content} brandName={brandName} brandColor={brandColor} />;

    case "docs":
    case "tutorial":
    case "guide":
      return (
        <DocumentationRenderer content={content} brandName={brandName} brandColor={brandColor} />
      );

    case "support":
      return <SupportRenderer content={content} brandName={brandName} brandColor={brandColor} />;

    default:
      // Check if it's API content based on content analysis
      if (
        content.chunks.some(
          (chunk) =>
            chunk.content.includes("GET ") ||
            chunk.content.includes("POST ") ||
            chunk.content.includes("API") ||
            chunk.content.includes("endpoint"),
        )
      ) {
        return <ApiSpecRenderer content={content} brandName={brandName} brandColor={brandColor} />;
      }

      return (
        <GenericContentRenderer content={content} brandName={brandName} brandColor={brandColor} />
      );
  }
}

// Helper functions
function renderContentChunk(chunk: ContentChunk, index: number): React.ReactNode {
  switch (chunk.type) {
    case "code":
      return (
        <AppsSdkCodeBlock language={chunk.metadata.language} title={chunk.metadata.section}>
          {chunk.searchableText}
        </AppsSdkCodeBlock>
      );

    case "table": {
      // Parse table data from content
      const tableData = parseTableFromContent(chunk.content);
      if (tableData) {
        return <AppsSdkTable headers={tableData.headers} rows={tableData.rows} />;
      }
      return <AppsSdkText>{chunk.searchableText}</AppsSdkText>;
    }

    case "list": {
      const listItems = parseListFromContent(chunk.content);
      return <AppsSdkList items={listItems} />;
    }

    case "header": {
      const level = chunk.metadata.level || 2;
      return (
        <AppsSdkHeading level={Math.min(level, 6) as any}>{chunk.searchableText}</AppsSdkHeading>
      );
    }

    default:
      return <AppsSdkText>{chunk.searchableText}</AppsSdkText>;
  }
}

function extractHttpMethod(content: string): string {
  const match = content.match(/\b(GET|POST|PUT|DELETE|PATCH)\b/);
  return match ? match[1] : "API";
}

function extractEndpoint(content: string): string {
  const match = content.match(/\b(GET|POST|PUT|DELETE|PATCH)\s+([^\s\n]+)/);
  return match ? match[2] : "/";
}

function getMethodColor(method: string): "success" | "warning" | "error" | "default" {
  switch (method.toLowerCase()) {
    case "get":
      return "success";
    case "post":
      return "warning";
    case "put":
    case "patch":
      return "warning";
    case "delete":
      return "error";
    default:
      return "default";
  }
}

function parseTableFromContent(content: string): { headers: string[]; rows: string[][] } | null {
  // Basic table parsing - can be enhanced
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return null;

  const headers = lines[0]
    .split("|")
    .map((h) => h.trim())
    .filter(Boolean);
  const rows = lines.slice(1).map((line) =>
    line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean),
  );

  return { headers, rows };
}

function parseListFromContent(content: string): string[] {
  return content
    .split("\n")
    .filter((line) => line.trim().match(/^[-*•]\s+/) || line.trim().match(/^\d+\.\s+/))
    .map((line) =>
      line
        .replace(/^[-*•]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .trim(),
    );
}
