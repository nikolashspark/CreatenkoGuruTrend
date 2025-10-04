// MCP Client для Apify через офіційний REST API
// Документація: https://docs.apify.com/platform/integrations/api
class MCPClient {
  constructor() {
    this.apifyToken = process.env.APIFY_API_TOKEN;
    this.apifyApiUrl = 'https://api.apify.com/v2';
  }

  async callApifyActor(pageId, country = 'US') {
    console.log(`Calling Apify Actor via REST API for page ${pageId} in ${country}`);
    
    if (!this.apifyToken) {
      throw new Error('APIFY_API_TOKEN not found in environment variables');
    }

    // Згідно з документацією: Authentication via Authorization header (рекомендовано)
    // https://docs.apify.com/platform/integrations/api#authentication
    const headers = {
      'Authorization': `Bearer ${this.apifyToken}`,
      'Content-Type': 'application/json'
    };

    // Крок 1: Запускаємо Actor
    // https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
    console.log('Step 1: Starting Apify Actor...');
    const facebookAdsUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&view_all_page_id=${pageId}`;
    
    const runResponse = await fetch(`${this.apifyApiUrl}/acts/apify~facebook-ads-scraper/runs`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        startUrls: [facebookAdsUrl],
        maxItems: 5
      })
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Apify API Error (${runResponse.status}): ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    const defaultDatasetId = runData.data.defaultDatasetId;

    console.log(`Actor started with run ID: ${runId}`);
    console.log(`Waiting for completion...`);

    // Крок 2: Чекаємо завершення (з timeout)
    let status = runData.data.status;
    let attempts = 0;
    const maxAttempts = 12; // 2 хвилини (12 * 10 секунд)

    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 секунд
      
      const statusResponse = await fetch(`${this.apifyApiUrl}/acts/apify~facebook-ads-scraper/runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${this.apifyToken}` }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        status = statusData.data.status;
        console.log(`Run status: ${status}`);
      }

      attempts++;
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Actor run failed with status: ${status}`);
    }

    // Крок 3: Отримуємо результати з dataset
    // https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items
    console.log('Step 3: Fetching results from dataset...');
    const datasetResponse = await fetch(`${this.apifyApiUrl}/datasets/${defaultDatasetId}/items`, {
      headers: { 'Authorization': `Bearer ${this.apifyToken}` }
    });

    if (!datasetResponse.ok) {
      throw new Error('Failed to fetch dataset items');
    }

    return await datasetResponse.json();
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

