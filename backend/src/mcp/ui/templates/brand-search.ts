import { type BrandData, BrandDataService } from "../../../services/brand-data";

export function createBrandSearchHTML(
  query: string,
  brandInfo: string,
  brand?: BrandData,
): string {
  const brandName = brand?.name || "Brand";
  const logoUrl = brand
    ? BrandDataService.getBrandLogoUrl(brand)
    : `https://logo.clearbit.com/${brand?.primary_domain || "example.com"}`;
  const tagline = brand
    ? BrandDataService.getBrandTagline(brand)
    : "Premium Brand Experience";
  const industryInfo = brand?.metadata?.industry || "Luxury Goods";
  const establishedYear =
    brand?.metadata?.founded_year || new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} Brand Information</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      color: #333;
      line-height: 1.6;
    }

    .brand-container {
      max-width: 700px;
      margin: 0 auto;
      background: white;
      border: 1px solid #e8e8e8;
      border-radius: 4px;
      overflow: hidden;
    }

    .header {
      background: #333;
      color: white;
      padding: 25px;
      text-align: center;
    }

    .header img {
      max-width: 180px;
      height: auto;
      margin-bottom: 15px;
      filter: brightness(0) invert(1);
    }

    .header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .search-query {
      color: #ccc;
      font-size: 1rem;
      font-style: italic;
    }

    .content-section {
      padding: 30px;
    }

    .brand-description {
      font-size: 1rem;
      line-height: 1.7;
      color: #444;
      margin-bottom: 20px;
      text-align: justify;
    }

    .brand-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 25px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .brand-detail {
      text-align: center;
    }

    .brand-detail-label {
      font-size: 0.8rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .brand-detail-value {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
    }

    .brand-footer {
      background: #f0f0f0;
      padding: 15px;
      text-align: center;
      color: #666;
      font-size: 0.8rem;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="brand-container">
    <div class="header">
      <img src="${logoUrl}" alt="${brandName}" onerror="this.style.display='none'" />
      <h1>About ${brandName}</h1>
      <div class="search-query">"${query}"</div>
    </div>

    <div class="content-section">
      <div class="brand-description">
        ${brandInfo}
      </div>

      ${
        brand
          ? `
      <div class="brand-details">
        <div class="brand-detail">
          <div class="brand-detail-label">Industry</div>
          <div class="brand-detail-value">${industryInfo}</div>
        </div>
        <div class="brand-detail">
          <div class="brand-detail-label">Domain</div>
          <div class="brand-detail-value">${brand.primary_domain}</div>
        </div>
        ${
          brand.metadata?.main_product
            ? `
        <div class="brand-detail">
          <div class="brand-detail-label">Main Product</div>
          <div class="brand-detail-value">${brand.metadata.main_product}</div>
        </div>
        `
            : ""
        }
      </div>
      `
          : ""
      }
    </div>

    <div class="brand-footer">
      Official ${brandName} brand information • ${tagline}
    </div>
  </div>
</body>
</html>`;
}
