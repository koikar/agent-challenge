import type { CategorizedUrls } from "./types";

/**
 * Categorize URLs by content type
 */
export function categorizeUrls(links: any[]): CategorizedUrls {
  const categories: CategorizedUrls = {
    company: [],
    blog: [],
    docs: [],
    ecommerce: [],
    other: [],
  };

  // Enhanced patterns for better detection
  const patterns = {
    company: {
      subdomains: ["www", "main", "corporate"],
      paths: [
        "about", "company", "team", "careers", "contact", 
        "investors", "leadership", "mission", "values"
      ],
      titles: [
        "about us", "our team", "careers", "contact us", 
        "leadership", "company"
      ],
    },
    blog: {
      subdomains: ["blog", "news", "media", "press", "stories"],
      paths: [
        "blog", "news", "articles", "updates", "press", 
        "media", "stories", "insights", "newsroom"
      ],
      titles: ["blog", "news", "article", "press", "update", "story"],
    },
    docs: {
      subdomains: ["docs", "help", "support", "api", "developer", "dev"],
      paths: [
        "docs", "documentation", "help", "support", "guide", 
        "api", "reference", "tutorial", "manual"
      ],
      titles: [
        "documentation", "help", "guide", "api", "reference", "tutorial"
      ],
    },
    ecommerce: {
      subdomains: ["shop", "store", "buy", "checkout", "cart"],
      paths: [
        "shop", "store", "buy", "cart", "checkout", "products", 
        "catalog", "marketplace", "order"
      ],
      titles: ["shop", "store", "buy", "product", "catalog", "marketplace"],
    },
  };

  links.forEach((link) => {
    try {
      const urlObj = new URL(link.url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      const title = (link.title || "").toLowerCase();

      let category: keyof CategorizedUrls = "other";
      let priority = 0;

      // Check each category for matches
      for (const [categoryName, categoryPatterns] of Object.entries(patterns)) {
        let categoryScore = 0;

        // Subdomain matching (highest priority)
        if (
          categoryPatterns.subdomains.some(
            (subdomain) =>
              hostname.startsWith(`${subdomain}.`) ||
              hostname.includes(`${subdomain}.`),
          )
        ) {
          categoryScore += 100;
        }

        // Path matching (high priority)
        if (
          categoryPatterns.paths.some(
            (path) =>
              pathname.includes(`/${path}`) || pathname.includes(path),
          )
        ) {
          categoryScore += 50;
        }

        // Title matching (medium priority)
        if (
          categoryPatterns.titles?.some((keyword) => title.includes(keyword))
        ) {
          categoryScore += 25;
        }

        // Homepage gets special treatment for company category
        if (
          categoryName === "company" &&
          (pathname === "/" || pathname === "/home")
        ) {
          categoryScore += 30;
        }

        if (categoryScore > priority) {
          category = categoryName as keyof CategorizedUrls;
          priority = categoryScore;
        }
      }

      categories[category].push({ ...link, priority });
    } catch {
      categories.other.push({ ...link, priority: 0 });
    }
  });

  return categories;
}

/**
 * Select top URLs per category
 */
export function selectTopUrls(categorized: CategorizedUrls, maxPerCategory: number = 8) {
  const selected = [];
  const priorities: (keyof CategorizedUrls)[] = ["company", "ecommerce", "docs", "blog", "other"];

  priorities.forEach((category) => {
    const urls = categorized[category] || [];
    const sorted = urls.sort((a: any, b: any) => b.priority - a.priority);
    selected.push(...sorted.slice(0, maxPerCategory));

    if (sorted.length > 0) {
      console.log(
        `[URL Processor] ${category}: Selected ${Math.min(sorted.length, maxPerCategory)}/${sorted.length} URLs`,
      );
    }
  });

  return selected;
}

/**
 * Categorize content type for R2 folder organization
 */
export function categorizeContent(url: string): string {
  try {
    const path = new URL(url).pathname.toLowerCase();

    if (
      path.includes("/blog") ||
      path.includes("/news") ||
      path.includes("/article")
    ) {
      return "blog";
    } else if (path.includes("/docs") || path.includes("/documentation")) {
      return "docs";
    } else if (
      path.includes("/support") ||
      path.includes("/help") ||
      path.includes("/faq")
    ) {
      return "support";
    } else if (path.includes("/case-stud") || path.includes("/customer-stor")) {
      return "case_study";
    } else if (path.includes("/about") || path.includes("/company")) {
      return "about";
    } else if (path.includes("/pricing") || path.includes("/plans")) {
      return "pricing";
    } else if (path.includes("/product") || path.includes("/features")) {
      return "product";
    } else if (path.includes("/tutorial") || path.includes("/guide")) {
      return "tutorial";
    } else if (path === "/" || path === "/home") {
      return "landing";
    } else {
      return "other";
    }
  } catch {
    return "pages";
  }
}

/**
 * Validate content quality before storing
 */
export function isValidContent(page: any): boolean {
  const url = page.metadata?.sourceURL || page.url || "";
  const content = page.markdown || "";

  // Skip error pages
  if (url.includes("/404") || url.includes("/500") || url.includes("error")) {
    console.log(`⏩ Skipping error page: ${url}`);
    return false;
  }

  // Skip if content is too short
  if (content && content.length < 50) {
    console.log(`⏩ Skipping short content: ${url} (${content.length} chars)`);
    return false;
  }

  // Skip if title is generic error
  if (
    page.metadata?.title &&
    (page.metadata.title.toLowerCase().includes("error") ||
      page.metadata.title.toLowerCase().includes("not found"))
  ) {
    console.log(`⏩ Skipping error title: ${url}`);
    return false;
  }

  return true;
}

/**
 * Clean and process content for better RAG performance
 */
export function cleanContent(content: string): string {
  return (
    content
      // Remove excessive whitespace
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      // Remove navigation and footer patterns
      .replace(/^(Home|About|Contact|Blog|Products?)$/gm, "")
      // Remove common footer text
      .replace(/©.*\d{4}.*$/gm, "")
      // Clean up markdown artifacts
      .replace(/\[.*?\]\(.*?\)/g, "") // Remove markdown links
      .replace(/^#{1,6}\s*/gm, "") // Remove markdown headers but keep content
      .trim()
  );
}

/**
 * URL normalization
 */
export function normalizeUrl(input: string): string {
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

    console.log(`[URL Processor] URL normalized: "${input}" → "${decoded}"`);
    return decoded;
  } catch (error) {
    console.error(`[URL Processor] URL normalization failed:`, error);
    return input
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .toLowerCase()
      .trim();
  }
}