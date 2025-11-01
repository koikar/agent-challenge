"use client";

import { Menu, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { BackgroundGradientAnimation } from "@/components/ui/shadcn-io/background-gradient-animation";
import { Meteors } from "@/components/ui/shadcn-io/meteors";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandUrl, setBrandUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating Navigation */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <nav className="bg-background/80 backdrop-blur-md rounded-2xl px-6 py-3 shadow-lg border border-border/20 mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-medium text-foreground">Tedix</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/playground"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Playground
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Menu className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-border/30">
              <div className="space-y-3">
                <Link
                  href="/playground"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Playground
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Hero Section - Full Height with Background Animation */}
      <section className="relative min-h-screen overflow-hidden">
        <BackgroundGradientAnimation
          gradientBackgroundStart="rgba(59, 130, 246, 0.05)"
          gradientBackgroundEnd="rgba(139, 92, 246, 0.05)"
          firstColor="59, 130, 246"
          secondColor="139, 92, 246"
          thirdColor="236, 72, 153"
          fourthColor="6, 182, 212"
          fifthColor="16, 185, 129"
          interactive={false}
          blendingValue="multiply"
          size="100%"
          containerClassName="absolute inset-0 opacity-30"
        />
        <Meteors number={8} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center min-h-screen flex flex-col justify-center">
          <div className="space-y-16">
            {/* Main Headline */}
            <div className="space-y-8">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none text-left max-w-3xl mx-auto">
                <span className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 bg-clip-text text-transparent dark:from-slate-300 dark:via-slate-200 dark:to-slate-100">
                  AI{" "}
                </span>
                <span className="inline-block w-[280px] md:w-[420px] lg:w-[520px] text-left">
                  <GooeyText
                    texts={["Visibility", "Brand", "Commerce"]}
                    className="text-6xl md:text-8xl lg:text-9xl font-black"
                    textClassName="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                    morphTime={0.8}
                    cooldownTime={0.9}
                  />
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Be discovered when people are mentioning about your brand.
              </p>
            </div>

            {/* Interactive Brand Input */}
            <div className="space-y-8">
              {/* URL Input Bar */}
              <div className="max-w-3xl mx-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    console.log("=== FORM SUBMIT EVENT ===");
                    console.log("Form submitted with brandUrl:", brandUrl);

                    if (brandUrl && brandUrl.trim()) {
                      setIsAnalyzing(true);
                      const encodedUrl = encodeURIComponent(brandUrl.trim());
                      const targetUrl = `/playground?url=${encodedUrl}`;
                      console.log("Navigating to:", targetUrl);

                      try {
                        router.push(targetUrl);
                        console.log("Router.push called successfully");
                      } catch (error) {
                        console.error("Router.push error:", error);
                      }
                    } else {
                      console.log("No brandUrl provided or empty string");
                    }
                  }}
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-background/90 backdrop-blur-md border border-border/30 rounded-full p-3 flex items-center gap-3 shadow-xl">
                      <div className="pl-4 flex items-center">
                        <Search className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter your brand URL (e.g., nike.com)"
                        value={brandUrl}
                        onChange={(e) => setBrandUrl(e.target.value)}
                        className="flex-1 text-xl py-4 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground font-medium"
                        disabled={isAnalyzing}
                        onKeyDown={(e) => {
                          console.log("Key pressed:", e.key);
                          if (e.key === "Enter") {
                            console.log("Enter key detected, submitting form");
                            e.currentTarget.form?.dispatchEvent(
                              new Event("submit", {
                                bubbles: true,
                                cancelable: true,
                              }),
                            );
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        size="lg"
                        disabled={!brandUrl || isAnalyzing}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground h-14 w-14 p-0 rounded-full hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                      >
                        {isAnalyzing ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <Sparkles className="h-7 w-7" />
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Quick Examples - Separate Component */}
              <div className="flex flex-col items-center justify-center gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Try these examples:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                  {["nike.com", "apple.com", "airbnb.com", "stripe.com"].map(
                    (url) => (
                      <Button
                        key={url}
                        variant="outline"
                        size="sm"
                        onClick={() => setBrandUrl(url)}
                        disabled={isAnalyzing}
                        className="text-sm px-4 py-2 hover:scale-105 hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 font-medium bg-background/90 border-border/40 rounded-full shadow-sm hover:shadow-md backdrop-blur-sm"
                      >
                        {url}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
