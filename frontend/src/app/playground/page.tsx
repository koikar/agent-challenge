"use client";

import { useChat } from "@ai-sdk/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UIActionResult } from "@mcp-ui/client";
import { isUIResource, UIResourceRenderer } from "@mcp-ui/client";
import { createClient } from "@supabase/supabase-js";
import { DefaultChatTransport } from "ai";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building,
  FileText,
  Globe,
  Loader2,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomIPadFrame } from "@/components/ui/custom-ipad-frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { BackgroundGradientAnimation } from "@/components/ui/shadcn-io/background-gradient-animation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Form schema for validation
const formSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/,
      "Please enter a valid domain (e.g., example.com)",
    )
    .transform((domain) =>
      domain
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .toLowerCase(),
    ),
});

interface MappingProgress {
  id: string;
  status: string;
  progress_percentage: number;
  current_step: string;
  urls_discovered: number;
  company_info_count: number;
  blog_count: number;
  docs_count: number;
  ecommerce_count: number;
  total_urls: number;
  subdomains: string[];
  company_info_samples: any[];
  blog_samples: any[];
  docs_samples: any[];
  ecommerce_samples: any[];
  error_message?: string;
  brand_id?: string; // For extract job tracking
}

interface ExtractJobProgress {
  id: string;
  brand_id: string;
  status: string;
  pages_processed: number;
  pages_found: number;
  credits_used: number;
  results?: {
    status: string;
    completed: number;
    total: number;
    creditsUsed: number;
  };
  error_message?: string;
}

interface BrandInfo {
  name: string;
  title: string;
  description: string;
  logo_url: string;
  contact_info: string;
  address: string;
  pricing_info: string;
}

export default function PlaygroundPage() {
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url") || "";

  // React Hook Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: urlParam,
    },
  });

  // Sync URL param with form
  useEffect(() => {
    if (urlParam && urlParam !== form.getValues().domain) {
      form.setValue("domain", urlParam);
    }
  }, [urlParam, form]);

  const [isScanning, setIsScanning] = useState(false);
  const [mappingProgress, setMappingProgress] =
    useState<MappingProgress | null>(null);
  const [extractProgress, setExtractProgress] =
    useState<ExtractJobProgress | null>(null);
  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
  const [liveBrandData, setLiveBrandData] = useState<any | null>(null);
  const [contentCounts, setContentCounts] = useState<Record<string, number>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("company_info");

  // AI Chat functionality
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>("openai/gpt-4o");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onError: (error) => console.error(error),
  });

  const models = [
    {
      name: "GPT 4o",
      value: "openai/gpt-4o",
    },
    {
      name: "Gemini 2.0 Flash Lite",
      value: "google/gemini-2.0-flash-lite",
    },
  ];

  const chatSuggestions = {
    "Search Nosana": "What is Nosana and their GPU marketplace?",
    "Nosana GPU Compute": "Tell me about Nosana's decentralized GPU compute network",
    "Nosana Pricing": "What are Nosana's pricing options for GPU computing?",
    "Nosana Token": "Explain the NOS token and its role in the Nosana ecosystem",
    "Nosana Technology": "How does Nosana's decentralized infrastructure work?",
  };

  // Chat handlers
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(
        { text: input },
        {
          body: {
            model: model,
            enableMCPUI: true, // Flag to enable MCP-UI tools
          },
        },
      );
      setInput("");
    }
  };

  const handleSuggestionClick = (suggestion: keyof typeof chatSuggestions) => {
    sendMessage(
      { text: chatSuggestions[suggestion] },
      {
        body: {
          model: model,
          enableMCPUI: true,
        },
      },
    );
  };

  // Handle actions from MCP-UI resources
  const handleUIAction = async (
    result: UIActionResult,
  ): Promise<{ status: string }> => {
    console.log("MCP-UI Action received:", result);

    if (result.type === "tool") {
      sendMessage(
        {
          text: `Execute ${result.payload.toolName} with params: ${JSON.stringify(result.payload.params)}`,
        },
        {
          body: {
            model: model,
            enableMCPUI: true,
            toolCall: result.payload,
          },
        },
      );
    } else if (result.type === "prompt") {
      sendMessage(
        { text: result.payload.prompt },
        {
          body: {
            model: model,
            enableMCPUI: true,
          },
        },
      );
    } else if (result.type === "link") {
      window.open(result.payload.url, "_blank");
    } else if (result.type === "notify") {
      console.log("Notification:", result.payload.message);
    }

    return { status: "Action handled by MCP-UI client" };
  };

  // Auto-cycle tabs every 5 seconds
  useEffect(() => {
    if (!mappingProgress || mappingProgress.status !== "completed") return;

    const tabs = ["company_info", "blog", "docs", "ecommerce"];
    const interval = setInterval(() => {
      setActiveTab((currentTab) => {
        const currentIndex = tabs.indexOf(currentTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        return tabs[nextIndex];
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [mappingProgress]);

  // Fetch live brand data when brand_id is available
  useEffect(() => {
    if (!mappingProgress?.brand_id) return;

    const fetchBrandData = async () => {
      try {
        const { data: brand } = await supabase
          .from("brands")
          .select("*")
          .eq("id", mappingProgress.brand_id)
          .single();

        if (brand) {
          setLiveBrandData(brand);
          // Update brandInfo with live data
          setBrandInfo({
            name: brand.name,
            title: brand.metadata?.title || `${brand.name} - Official Website`,
            description: brand.description,
            logo_url: brand.logo_url,
            contact_info: brand.metadata?.contact_info || "",
            address: brand.metadata?.address || "",
            pricing_info: brand.metadata?.pricing_info || "",
          });
        }

        // Fetch content counts by category
        const { data: contentStats } = await supabase
          .from("brand_content")
          .select("content_type")
          .eq("brand_id", mappingProgress.brand_id);

        if (contentStats) {
          const counts = contentStats.reduce(
            (acc, item) => {
              acc[item.content_type] = (acc[item.content_type] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );
          setContentCounts(counts);
        }
      } catch (error) {
        console.error("Error fetching live brand data:", error);
      }
    };

    fetchBrandData();
  }, [mappingProgress?.brand_id]);

  // Enhanced real-time subscription for mapping AND extract progress
  useEffect(() => {
    if (!mappingProgress?.id) return;

    const channel = supabase
      .channel("brand_discovery_progress")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "playground_url_mappings",
          filter: `id=eq.${mappingProgress.id}`,
        },
        (payload) => {
          console.log("Mapping update:", payload.new);
          setMappingProgress(payload.new as MappingProgress);

          if (payload.new.status === "completed") {
            setIsScanning(false);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "firecrawl_extract_jobs",
          filter: `brand_id=eq.${mappingProgress.brand_id}`,
        },
        (payload) => {
          console.log("Extract job update:", payload.new);
          setExtractProgress(payload.new as ExtractJobProgress);

          // Update mapping progress with extract details
          if (
            payload.new.status === "completed" &&
            payload.new.pages_processed > 0
          ) {
            setMappingProgress((prev) =>
              prev
                ? {
                    ...prev,
                    current_step: `✅ Indexed ${payload.new.pages_processed} pages for AI search!`,
                    progress_percentage: 100,
                  }
                : null,
            );
            setIsScanning(false);
          } else if (payload.new.status === "failed") {
            setMappingProgress((prev) =>
              prev
                ? {
                    ...prev,
                    current_step: `❌ Content extraction failed: ${payload.new.error_message}`,
                    progress_percentage: 100,
                  }
                : null,
            );
            setIsScanning(false);
          } else if (
            payload.new.status === "processing" &&
            payload.new.pages_processed > 0
          ) {
            const progressPercent = Math.min(
              90,
              70 +
                (payload.new.pages_processed / (payload.new.pages_found || 1)) *
                  20,
            );
            setMappingProgress((prev) =>
              prev
                ? {
                    ...prev,
                    current_step: `🔄 Extracting content (${payload.new.pages_processed}/${payload.new.pages_found || 0} pages)...`,
                    progress_percentage: progressPercent,
                  }
                : null,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "brands",
          filter: `id=eq.${mappingProgress.brand_id}`,
        },
        (payload) => {
          console.log("Brand update:", payload.new);
          setLiveBrandData(payload.new);

          // Update brandInfo with fresh data from database
          if (payload.new) {
            setBrandInfo({
              name: payload.new.name,
              title:
                payload.new.metadata?.title ||
                `${payload.new.name} - Official Website`,
              description: payload.new.description,
              logo_url: payload.new.logo_url,
              contact_info: payload.new.metadata?.contact_info || "",
              address: payload.new.metadata?.address || "",
              pricing_info: payload.new.metadata?.pricing_info || "",
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "brand_content",
          filter: `brand_id=eq.${mappingProgress.brand_id}`,
        },
        (payload) => {
          console.log("Brand content update:", payload.eventType, payload.new);

          // Refresh content counts when content is added
          if (payload.eventType === "INSERT" && payload.new) {
            setContentCounts((prev) => ({
              ...prev,
              [payload.new.content_type]:
                (prev[payload.new.content_type] || 0) + 1,
            }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mappingProgress?.id, mappingProgress?.brand_id]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsScanning(true);
    setError(null);
    setMappingProgress(null);
    setExtractProgress(null);
    setBrandInfo(null);
    setLiveBrandData(null);
    setContentCounts({});

    try {
      const response = await fetch("/api/playground/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: values.domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        setIsScanning(false);
        return;
      }

      if (data.cached) {
        // Show cached results immediately
        setMappingProgress(data.mapping);
        setIsScanning(false);

        // Use the brand info from the API response if available, otherwise create it
        if (data.scrapingResult) {
          setBrandInfo(data.scrapingResult);
        } else {
          // Fallback brand info for cached results
          const domain = data.mapping.domain;
          const brandName =
            domain.split(".")[0].charAt(0).toUpperCase() +
            domain.split(".")[0].slice(1);
          setBrandInfo({
            name: brandName,
            title: `${domain} - Official Website`,
            description: `Official website and services from ${domain}`,
            logo_url: `https://logo.clearbit.com/${domain}`,
            contact_info: `Visit ${domain} for contact information`,
            address: "Visit our contact page for address details",
            pricing_info: "Visit our pricing page for detailed information",
          });
        }
      } else {
        // Set initial progress and brand info
        setMappingProgress(data.mapping);
        setBrandInfo(data.scrapingResult);
      }
    } catch (error) {
      console.error("Scan error:", error);
      setError("Failed to start scan. Please try again.");
      setIsScanning(false);
    }
  };

  // Auto-start scan if URL parameter is provided
  useEffect(() => {
    if (urlParam && !mappingProgress && !isScanning) {
      const values = form.getValues();
      if (values.domain) {
        onSubmit(values);
      }
    }
  }, [urlParam]);

  const resetScan = () => {
    setIsScanning(false);
    setMappingProgress(null);
    setExtractProgress(null);
    setBrandInfo(null);
    setLiveBrandData(null);
    setContentCounts({});
    setError(null);
    form.reset({ domain: "" });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "initializing":
        return { text: "Initializing...", color: "blue" };
      case "scraping_main":
        return { text: "Validating domain...", color: "blue" };
      case "mapping_urls":
        return { text: "Discovering URLs...", color: "purple" };
      case "categorizing":
        return { text: "Categorizing content...", color: "orange" };
      case "completed":
        return { text: "Analysis complete!", color: "green" };
      case "failed":
        return { text: "Analysis failed", color: "red" };
      default:
        return { text: status, color: "gray" };
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgba(59, 130, 246, 0.02)"
        gradientBackgroundEnd="rgba(139, 92, 246, 0.02)"
        firstColor="59, 130, 246"
        secondColor="139, 92, 246"
        thirdColor="236, 72, 153"
        interactive={false}
        blendingValue="multiply"
        size="120%"
        containerClassName="absolute inset-0 opacity-20"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        {/* Centered Floating Header */}
        <div className="flex justify-center mb-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center bg-background/80 backdrop-blur-md border border-border/20 rounded-full shadow-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="rounded-full h-10 w-10 p-0 m-2 hover:bg-accent/10"
              >
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="sr-only">Back to Home</span>
                </Link>
              </Button>

              {/* Separator */}
              <div className="w-px h-6 bg-border/40"></div>

              {/* Inline Search Bar */}
              <div
                className={`transition-all duration-300 ease-out ${isSearchFocused ? "min-w-[32rem]" : "min-w-80"}`}
              >
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <InputGroup className="border-0 bg-transparent">
                    <InputGroupAddon className="pl-3 pr-3 bg-transparent">
                      {brandInfo?.logo_url ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
                          <img
                            src={brandInfo.logo_url}
                            alt={brandInfo.name}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const globeIcon = e.currentTarget
                                .nextElementSibling as HTMLElement;
                              if (globeIcon) globeIcon.style.display = "block";
                            }}
                          />
                          <Globe className="h-6 w-6 text-muted-foreground hidden" />
                        </div>
                      ) : (
                        <Globe className="h-6 w-6 text-muted-foreground" />
                      )}
                    </InputGroupAddon>
                    <InputGroupInput
                      type="text"
                      placeholder="Enter brand URL..."
                      className="h-10 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-lg font-medium transition-all duration-300"
                      disabled={isScanning}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      {...form.register("domain")}
                    />
                    <InputGroupAddon
                      align="inline-end"
                      className="pr-2 bg-transparent"
                    >
                      <InputGroupButton
                        type="submit"
                        size="sm"
                        disabled={isScanning || !form.formState.isValid}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 w-8 p-0 rounded-full transition-all font-medium border-0"
                      >
                        {isScanning ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-destructive font-medium">Error</span>
            </div>
            <p className="text-destructive mt-2">{error}</p>
          </div>
        )}

        {/* Real-Time Progress */}
        {mappingProgress && (
          <div className="mb-8">
            {/* Progress Header */}
            <div className="text-center">
              {(mappingProgress.status !== "completed" ||
                extractProgress?.status === "processing") && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-4">
                    Analyzing{" "}
                    {form.getValues().domain || mappingProgress.domain}
                  </h2>
                </div>
              )}

              {(mappingProgress.status !== "completed" ||
                extractProgress?.status === "processing") && (
                <div className="max-w-md mx-auto space-y-3">
                  <Progress
                    value={mappingProgress.progress_percentage}
                    className="h-2"
                  />
                  <div className="flex items-center justify-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        getStatusDisplay(mappingProgress.status).color ===
                        "blue"
                          ? "bg-blue-500"
                          : getStatusDisplay(mappingProgress.status).color ===
                              "purple"
                            ? "bg-purple-500"
                            : getStatusDisplay(mappingProgress.status).color ===
                                "orange"
                              ? "bg-orange-500"
                              : getStatusDisplay(mappingProgress.status)
                                    .color === "green"
                                ? "bg-green-500"
                                : getStatusDisplay(mappingProgress.status)
                                      .color === "red"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-muted-foreground">
                      {mappingProgress.current_step}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {mappingProgress.urls_discovered > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-700 border-blue-500/20"
                      >
                        {mappingProgress.urls_discovered} URLs discovered
                      </Badge>
                    )}
                    {extractProgress && extractProgress.pages_processed > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-700 border-green-500/20"
                      >
                        {extractProgress.pages_processed}/
                        {extractProgress.pages_found} pages processed
                      </Badge>
                    )}
                    {extractProgress?.credits_used && (
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-700 border-purple-500/20"
                      >
                        {extractProgress.credits_used} credits used
                      </Badge>
                    )}
                  </div>

                  {/* Cancel Button for Long-Running Jobs */}
                  {(extractProgress?.status === "processing" ||
                    mappingProgress.status === "mapping_urls") && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetScan}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Cancel Analysis
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Chat Interface - Always Visible */}
        <div className="space-y-8">
          {/* Interactive Category Tabs */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Tab Navigation Cards - Left Side */}
              <div className="lg:order-1 space-y-4">
                {/* Section Title - Above Tabs */}
                <div className="text-left mb-6">
                  <h2 className="text-3xl font-bold mb-4">Live AI Chat</h2>
                  <p className="text-lg text-muted-foreground">
                    Chat directly with AI about discovered brands using real MCP
                    tools and brand intelligence
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab("company_info")}
                    className={`w-full cursor-pointer p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
                      activeTab === "company_info"
                        ? "bg-blue-500/10 border-blue-500/30 shadow-lg"
                        : "bg-background/80 border-border/20 hover:border-blue-500/20"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-sm mb-1">
                          Company Information
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Pricing, contact details, company info
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs mt-2 bg-blue-500/10 text-blue-700 border-blue-500/20"
                        >
                          {contentCounts.company ||
                            contentCounts.about ||
                            mappingProgress?.company_info_count ||
                            0}{" "}
                          pages
                        </Badge>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("blog")}
                    className={`w-full cursor-pointer p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
                      activeTab === "blog"
                        ? "bg-purple-500/10 border-purple-500/30 shadow-lg"
                        : "bg-background/80 border-border/20 hover:border-purple-500/20"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-sm mb-1">
                          Blog & News
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Latest articles and announcements
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs mt-2 bg-purple-500/10 text-purple-700 border-purple-500/20"
                        >
                          {contentCounts.blog ||
                            contentCounts.news ||
                            mappingProgress?.blog_count ||
                            0}{" "}
                          articles
                        </Badge>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("docs")}
                    className={`w-full cursor-pointer p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
                      activeTab === "docs"
                        ? "bg-green-500/10 border-green-500/30 shadow-lg"
                        : "bg-background/80 border-border/20 hover:border-green-500/20"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-sm mb-1">
                          Documentation
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Help guides and support docs
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs mt-2 bg-green-500/10 text-green-700 border-green-500/20"
                        >
                          {contentCounts.docs ||
                            contentCounts.support ||
                            contentCounts.guide ||
                            mappingProgress?.docs_count ||
                            0}{" "}
                          guides
                        </Badge>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("ecommerce")}
                    className={`w-full cursor-pointer p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
                      activeTab === "ecommerce"
                        ? "bg-orange-500/10 border-orange-500/30 shadow-lg"
                        : "bg-background/80 border-border/20 hover:border-orange-500/20"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-sm mb-1">
                          Ecommerce
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Products and shopping pages
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs mt-2 bg-orange-500/10 text-orange-700 border-orange-500/20"
                        >
                          {contentCounts.ecommerce ||
                            contentCounts.product ||
                            mappingProgress?.ecommerce_count ||
                            0}{" "}
                          products
                        </Badge>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Publish Your App CTA */}
                <div className="pt-6">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-white font-semibold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    asChild
                  >
                    <Link
                      href="/auth"
                      className="flex items-center justify-center space-x-3"
                    >
                      <Sparkles className="w-6 h-6" />
                      <span className="text-xl">Publish Your App</span>
                      <ArrowRight className="w-6 h-6" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Interactive AI Chat - Center/Right */}
              <div className="lg:order-2 lg:col-span-2 flex justify-center">
                <div className="relative">
                  {/* Glow effect around iPad */}
                  <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-50"></div>

                  <CustomIPadFrame
                    width={600}
                    height={800}
                    className="drop-shadow-2xl w-full max-w-[600px] max-h-[800px]"
                  >
                    <div className="w-full h-full p-6 flex flex-col">
                      <Conversation className="flex-1">
                        <ConversationContent>
                          {messages.map((message) => (
                            <Message from={message.role} key={message.id}>
                              <MessageContent>
                                {message.parts.map((part, i) => {
                                  if (part.type === "text") {
                                    return (
                                      <Response key={`${message.id}-${i}`}>
                                        {part.text}
                                      </Response>
                                    );
                                  } else if (part.type === "reasoning") {
                                    return (
                                      <Reasoning
                                        key={`${message.id}-${i}`}
                                        className="w-full"
                                        isStreaming={status === "streaming"}
                                      >
                                        <ReasoningTrigger />
                                        <ReasoningContent>
                                          {part.text}
                                        </ReasoningContent>
                                      </Reasoning>
                                    );
                                  } else if (
                                    part.type === "dynamic-tool" ||
                                    part.type.startsWith("tool-")
                                  ) {
                                    const toolOutput = part.output;
                                    const uiResources: React.ReactNode[] = [];

                                    if (
                                      toolOutput &&
                                      toolOutput.content &&
                                      Array.isArray(toolOutput.content)
                                    ) {
                                      toolOutput.content.forEach(
                                        (
                                          contentItem: any,
                                          contentIndex: number,
                                        ) => {
                                          if (isUIResource(contentItem)) {
                                            uiResources.push(
                                              <div
                                                key={`ui-${message.id}-${i}-${contentIndex}`}
                                                className="w-full my-4 border-2 border-blue-200 rounded-lg p-2"
                                              >
                                                <UIResourceRenderer
                                                  resource={
                                                    contentItem.resource
                                                  }
                                                  onUIAction={handleUIAction}
                                                  htmlProps={{
                                                    autoResizeIframe: true,
                                                    style: {
                                                      width: "100%",
                                                      minHeight: "200px",
                                                      maxHeight: "400px",
                                                      border:
                                                        "1px solid #e1e5e9",
                                                      borderRadius: "8px",
                                                    },
                                                  }}
                                                />
                                              </div>,
                                            );
                                          }
                                        },
                                      );
                                    }

                                    return (
                                      <div key={`${message.id}-${i}`}>
                                        <Tool defaultOpen={false}>
                                          {/* @ts-expect-error */}
                                          <ToolHeader part={part} />
                                          <ToolContent>
                                            {/* @ts-expect-error */}
                                            <ToolInput input={part.input} />
                                            <ToolOutput
                                              // @ts-expect-error
                                              part={part}
                                              // @ts-expect-error
                                              network={
                                                message.metadata?.network
                                              }
                                            />
                                          </ToolContent>
                                        </Tool>
                                        {uiResources.length > 0 && (
                                          <div className="mt-4 space-y-4">
                                            {uiResources}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else if (part.type === "resource") {
                                    if (isUIResource(part)) {
                                      return (
                                        <div
                                          key={`${message.id}-${i}`}
                                          className="w-full my-2"
                                        >
                                          <UIResourceRenderer
                                            resource={part.resource}
                                            onUIAction={handleUIAction}
                                            htmlProps={{
                                              autoResizeIframe: true,
                                              style: {
                                                width: "100%",
                                                minHeight: "200px",
                                                border: "1px solid #e1e5e9",
                                                borderRadius: "8px",
                                              },
                                            }}
                                          />
                                        </div>
                                      );
                                    }
                                  }
                                  return null;
                                })}
                              </MessageContent>
                            </Message>
                          ))}
                          {status === "submitted" && <Loader />}
                          {status === "error" && (
                            <div>Something went wrong</div>
                          )}
                        </ConversationContent>
                        <ConversationScrollButton />
                      </Conversation>

                      <Suggestions className="justify-center mb-4 gap-2 flex-wrap">
                        {Object.keys(chatSuggestions).map((suggestion) => (
                          <Suggestion
                            key={suggestion}
                            suggestion={suggestion}
                            onClick={() =>
                              handleSuggestionClick(
                                suggestion as keyof typeof chatSuggestions,
                              )
                            }
                            variant="outline"
                            size="sm"
                            className="text-xs px-3 py-1"
                          />
                        ))}
                      </Suggestions>

                      <PromptInput
                        onSubmit={handleChatSubmit}
                        className="mt-auto"
                      >
                        <PromptInputTextarea
                          onChange={(e) => setInput(e.target.value)}
                          value={input}
                          placeholder="Chat about discovered brands..."
                          minHeight={40}
                          maxHeight={40}
                        />
                        <PromptInputToolbar>
                          <PromptInputTools>
                            <PromptInputModelSelect
                              onValueChange={(value) => {
                                setModel(value);
                              }}
                              value={model}
                            >
                              <PromptInputModelSelectTrigger>
                                <PromptInputModelSelectValue />
                              </PromptInputModelSelectTrigger>
                              <PromptInputModelSelectContent>
                                {models.map((model) => (
                                  <PromptInputModelSelectItem
                                    key={model.value}
                                    value={model.value}
                                  >
                                    {model.name}
                                  </PromptInputModelSelectItem>
                                ))}
                              </PromptInputModelSelectContent>
                            </PromptInputModelSelect>
                          </PromptInputTools>
                          <PromptInputSubmit
                            disabled={!input}
                            status={status}
                          />
                        </PromptInputToolbar>
                      </PromptInput>
                    </div>
                  </CustomIPadFrame>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
