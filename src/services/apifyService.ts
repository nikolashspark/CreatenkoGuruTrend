// Apify Service
// Сервіс для роботи з Apify API для скрапінгу Facebook Ads

const APIFY_API_TOKEN = import.meta.env.VITE_APIFY_API_TOKEN;
const APIFY_API_URL = 'https://api.apify.com/v2';

export interface FacebookAdData {
  id: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  pageName: string;
  adType: string;
  createdAt: string;
  country: string;
  pageId: string;
}

export interface ApifyRunResult {
  runId: string;
  status: string;
  datasetId?: string;
  items?: FacebookAdData[];
}

// Функція для запуску Apify Actor
export const runApifyActor = async (
  actorId: string,
  input: any
): Promise<ApifyRunResult> => {
  try {
    if (!APIFY_API_TOKEN) {
      throw new Error('Apify API token not found. Please set VITE_APIFY_API_TOKEN environment variable.');
    }
    
    console.log(`Starting Apify Actor: ${actorId}`);
    
    // Запускаємо Actor
    const runResponse = await fetch(`${APIFY_API_URL}/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: input
      })
    });

    if (!runResponse.ok) {
      const errorData = await runResponse.json();
      throw new Error(`Apify API Error: ${errorData.error?.message || runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    console.log(`Apify Actor started with run ID: ${runId}`);

    // Чекаємо завершення виконання
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 30; // 5 хвилин максимум

    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 секунд
      
      const statusResponse = await fetch(`${APIFY_API_URL}/acts/${actorId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${APIFY_API_TOKEN}`,
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        status = statusData.data.status;
        console.log(`Run status: ${status}`);
      }

      attempts++;
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Apify Actor failed with status: ${status}`);
    }

    // Отримуємо результати
    const datasetResponse = await fetch(`${APIFY_API_URL}/acts/${actorId}/runs/${runId}/dataset/items`, {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      }
    });

    if (!datasetResponse.ok) {
      throw new Error('Failed to fetch dataset items');
    }

    const items = await datasetResponse.json();

    return {
      runId,
      status,
      items: items.slice(0, 5), // Беремо тільки 5 останніх
    };

  } catch (error: any) {
    console.error('Apify Service Error:', error);
    throw new Error(`Apify Service Error: ${error.message}`);
  }
};

// Функція для скрапінгу Facebook Ads
export const scrapeFacebookAds = async (
  pageId: string,
  country: string = 'US'
): Promise<FacebookAdData[]> => {
  try {
    const input = {
      pageIds: [pageId],
      countries: [country],
      adStatus: 'ACTIVE',
      adType: 'ALL',
      mediaType: 'ALL',
      limit: 5,
      maxAge: 30, // 30 днів
    };

    const result = await runApifyActor('apify/facebook-ads-scraper', input);
    
    if (!result.items) {
      throw new Error('No ads found');
    }

    // Трансформуємо дані в наш формат
    return result.items.map((item: any) => ({
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

  } catch (error: any) {
    console.error('Facebook Ads Scraping Error:', error);
    throw new Error(`Facebook Ads Scraping Error: ${error.message}`);
  }
};

// Функція для тестування Apify підключення
export const testApifyConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${APIFY_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Apify connection test failed:', error);
    return false;
  }
};
