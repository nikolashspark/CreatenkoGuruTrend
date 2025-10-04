// MCP Client для Apify через HTTP API (простіше для AI агентів)
class MCPClient {
  constructor() {
    this.apifyToken = process.env.APIFY_API_TOKEN;
    this.apifyApiUrl = 'https://api.apify.com/v2';
  }

  async callApifyActor(pageId, country = 'US') {
    console.log(`Calling Apify Actor via API for page ${pageId} in ${country}`);
    
    if (!this.apifyToken) {
      throw new Error('APIFY_API_TOKEN not found in environment variables');
    }

    // Використовуємо run-sync-get-dataset-items для швидкого отримання результатів
    const response = await fetch(`${this.apifyApiUrl}/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apifyToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startUrls: [`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=${pageId}`],
        maxItems: 5,
        proxyConfiguration: {
          useApifyProxy: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  async scrapeFacebookAds(pageId, country = 'US') {
    try {
      const result = await this.callApifyActor(pageId, country);
      
      // Трансформуємо результат в наш формат
      if (Array.isArray(result)) {
        return result.slice(0, 5).map((item) => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          text: item.text || item.adText || item.body || 'No text available',
          imageUrl: item.imageUrl || item.image || item.thumbnail || null,
          videoUrl: item.videoUrl || item.video || null,
          pageName: item.pageName || item.page?.name || 'Unknown Page',
          adType: item.adType || item.type || 'Unknown',
          createdAt: item.createdAt || item.startDate || new Date().toISOString(),
          country: item.country || country,
          pageId: item.pageId || pageId,
        }));
      }

      // Якщо немає результатів, повертаємо порожній масив
      return [];
    } catch (error) {
      console.error('MCP Client Error:', error);
      throw error;
    }
  }
}

module.exports = MCPClient;

