export interface BrandInfo {
  name: string;
  description: string;
  logo_url: string;
  industry: string;
  contact_email?: string;
  phone_number?: string;
  address?: string;
  pricing_info?: string;
  main_product?: string;
}

export interface BrandDiscoveryResult {
  success: boolean;
  brandInfo?: BrandInfo;
  error?: string;
}

export interface ProcessedContent {
  url: string;
  title: string;
  content: string;
  processed_content: string;
  contentType: string;
  images?: string[];
}

export interface CategorizedUrls {
  company: any[];
  blog: any[];
  docs: any[];
  ecommerce: any[];
  other: any[];
}