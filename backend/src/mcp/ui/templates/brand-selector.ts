import { BrandData, BrandDataService } from '../../../services/brand-data'

export function createBrandSelectorHTML(brands: BrandData[]): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Select a Brand - Tedix</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .header h1 {
      color: white;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 10px;
    }

    .header p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.1rem;
    }

    .brands-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }

    .brand-card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid transparent;
    }

    .brand-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      border-color: #667eea;
    }

    .brand-logo {
      width: 120px;
      height: 60px;
      object-fit: contain;
      margin-bottom: 20px;
      border-radius: 8px;
    }

    .brand-name {
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 10px;
      color: #2d3748;
    }

    .brand-description {
      font-size: 0.9rem;
      color: #718096;
      line-height: 1.5;
      margin-bottom: 15px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .brand-industry {
      display: inline-block;
      background: #e2e8f0;
      color: #4a5568;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      margin-bottom: 15px;
    }

    .brand-domain {
      font-size: 0.8rem;
      color: #a0aec0;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
    }

    .select-button {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 15px;
      transition: all 0.3s ease;
    }

    .select-button:hover {
      background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
      transform: translateY(-1px);
    }

    .stats {
      display: flex;
      justify-content: space-around;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 1.2rem;
      font-weight: 600;
      color: #2d3748;
    }

    .stat-label {
      font-size: 0.7rem;
      color: #a0aec0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Tedix Brand Platform</h1>
      <p>Choose a brand to interact with through AI-powered tools</p>
    </div>

    <div class="brands-grid">
      ${brands.map(brand => `
        <div class="brand-card" onclick="selectBrand('${brand.slug}')">
          <img src="${BrandDataService.getBrandLogoUrl(brand)}" alt="${brand.name}" class="brand-logo" onerror="this.style.display='none'" />
          <div class="brand-name">${brand.name}</div>
          <div class="brand-industry">${brand.metadata?.industry || 'General'}</div>
          <div class="brand-description">${brand.description}</div>
          <div class="brand-domain">${brand.primary_domain}</div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${brand.crawl_status === 'completed' ? '✅' : '⏳'}</div>
              <div class="stat-label">Status</div>
            </div>
            <div class="stat">
              <div class="stat-value">${brand.total_pages || 0}</div>
              <div class="stat-label">Pages</div>
            </div>
            <div class="stat">
              <div class="stat-value">${brand.is_public ? '🌐' : '🔒'}</div>
              <div class="stat-label">Access</div>
            </div>
          </div>
          
          <button class="select-button">
            Explore ${brand.name}
          </button>
        </div>
      `).join('')}
    </div>
  </div>

  <script>
    function selectBrand(slug) {
      // Send message to parent to switch to this brand
      window.parent.postMessage({
        type: 'brand_selected',
        payload: { brandSlug: slug }
      }, '*');
    }
  </script>
</body>
</html>`;
}