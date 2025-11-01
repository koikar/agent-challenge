import { createClient } from "@supabase/supabase-js";

// Create a Supabase client factory
function createSupabaseClient(env: any) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || "";

  if (!supabaseKey) {
    throw new Error("SUPABASE_ANON_KEY environment variable is required");
  }

  return createClient(supabaseUrl, supabaseKey);
}

export interface BrandData {
  id: string;
  name: string;
  description: string;
  primary_domain: string;
  logo_url: string;
  metadata: {
    industry?: string;
    main_product?: string;
    pricing_info?: string;
    contact_email?: string;
    address?: string;
    phone_number?: string;
  };
  slug: string;
}

export class BrandDataService {
  static async getBrandByDomain(domain: string, env: any): Promise<BrandData | null> {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("primary_domain", domain)
      .single();

    if (error || !data) {
      return null;
    }

    return data as BrandData;
  }

  static async getBrandBySlug(slug: string, env: any): Promise<BrandData | null> {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return null;
    }

    return data as BrandData;
  }

  static async getAllBrands(env: any): Promise<BrandData[]> {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error || !data) {
      return [];
    }

    return data as BrandData[];
  }

  static async searchBrands(query: string, env: any): Promise<BrandData[]> {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .or(
        `name.ilike.%${query}%,description.ilike.%${query}%,primary_domain.ilike.%${query}%`,
      )
      .eq("is_active", true)
      .order("name");

    if (error || !data) {
      return [];
    }

    return data as BrandData[];
  }

  // Helper to get the best available logo URL
  static getBrandLogoUrl(brand: BrandData): string {
    if (brand.logo_url && brand.logo_url !== brand.primary_domain) {
      return brand.logo_url;
    }

    if (
      brand.metadata?.logo_url &&
      brand.metadata.logo_url !== brand.primary_domain
    ) {
      return brand.metadata.logo_url;
    }

    // Fallback to a generic logo or favicon
    return `https://${brand.primary_domain}/favicon.ico`;
  }

  // Helper to get brand tagline/industry info
  static getBrandTagline(brand: BrandData): string {
    if (brand.metadata?.industry) {
      return brand.metadata.industry;
    }

    if (brand.metadata?.main_product) {
      return brand.metadata.main_product;
    }

    return "Premium Brand Experience";
  }
}
