// MCP Client для Apify Facebook Ads Scraper
const { spawn } = require('child_process');

class MCPClient {
  constructor() {
    this.apifyToken = process.env.APIFY_API_TOKEN;
  }

  async callApifyActor(pageId, country = 'US') {
    return new Promise((resolve, reject) => {
      console.log(`Calling Apify Actor via MCP for page ${pageId} in ${country}`);

      // Запускаємо MCP клієнт через npx
      const mcp = spawn('npx', [
        '-y',
        '@apify/actors-mcp-server',
        '--tools',
        'apify/facebook-ads-scraper'
      ], {
        env: {
          ...process.env,
          APIFY_TOKEN: this.apifyToken
        }
      });

      let outputData = '';
      let errorData = '';

      mcp.stdout.on('data', (data) => {
        outputData += data.toString();
        console.log('MCP stdout:', data.toString());
      });

      mcp.stderr.on('data', (data) => {
        errorData += data.toString();
        console.error('MCP stderr:', data.toString());
      });

      mcp.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`MCP process exited with code ${code}: ${errorData}`));
        } else {
          try {
            // Парсимо вихідні дані
            const result = JSON.parse(outputData);
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse MCP output: ${e.message}`));
          }
        }
      });

      // Відправляємо команду через stdin
      const command = {
        method: 'tools/call',
        params: {
          name: 'apify/facebook-ads-scraper',
          arguments: {
            startUrls: [`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=${pageId}`],
            maxItems: 5
          }
        }
      };

      mcp.stdin.write(JSON.stringify(command) + '\n');
      mcp.stdin.end();
    });
  }

  async scrapeFacebookAds(pageId, country = 'US') {
    try {
      const result = await this.callApifyActor(pageId, country);
      
      // Трансформуємо результат в наш формат
      if (result.content && Array.isArray(result.content)) {
        return result.content.slice(0, 5).map((item) => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          text: item.text || item.adText || 'No text available',
          imageUrl: item.imageUrl || item.image || null,
          videoUrl: item.videoUrl || item.video || null,
          pageName: item.pageName || item.page?.name || 'Unknown Page',
          adType: item.adType || item.type || 'Unknown',
          createdAt: item.createdAt || item.startDate || new Date().toISOString(),
          country: item.country || country,
          pageId: item.pageId || pageId,
        }));
      }

      throw new Error('Invalid response format from MCP');
    } catch (error) {
      console.error('MCP Client Error:', error);
      throw error;
    }
  }
}

module.exports = MCPClient;

