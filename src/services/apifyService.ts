// Apify Service
// Сервіс для роботи з Apify API через Railway backend

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'https://createnkogurutrend-production.up.railway.app';

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

// Всі Apify виклики тепер йдуть через Railway backend

// Функція для скрапінгу Facebook Ads через Railway backend
export const scrapeFacebookAds = async (
  pageId: string,
  country: string = 'US',
  count: number = 10
): Promise<FacebookAdData[]> => {
  try {
    console.log(`Scraping Facebook Ads for page ${pageId} in ${country}, count: ${count}`);

    const response = await fetch(`${RAILWAY_API_URL}/api/apify/facebook-ads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageId,
        country,
        count
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Railway Backend Error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.ads) {
      throw new Error('No ads found or invalid response');
    }

    return data.ads;

  } catch (error: any) {
    console.error('Facebook Ads Scraping Error:', error);
    throw new Error(`Facebook Ads Scraping Error: ${error.message}`);
  }
};

// Функція для завантаження збережених оголошень з Supabase
export const getSavedFacebookAds = async (
  pageId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<FacebookAdData[]> => {
  try {
    console.log(`Fetching saved Facebook Ads from Supabase`, { pageId, limit, offset });

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    if (pageId) {
      params.append('page_id', pageId);
    }

    const response = await fetch(`${RAILWAY_API_URL}/api/facebook-ads?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend Error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.ads) {
      throw new Error('No ads found or invalid response');
    }

    console.log(`✅ Loaded ${data.ads.length} saved ads from Supabase`);
    return data.ads;

  } catch (error: any) {
    console.error('Saved Facebook Ads Loading Error:', error);
    throw new Error(`Failed to load saved ads: ${error.message}`);
  }
};

// Функція для тестування Apify підключення через Railway backend
export const testApifyConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/apify/facebook-ads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageId: 'test',
        country: 'US'
      })
    });
    
    // Якщо отримали помилку про відсутність Page ID, значить backend працює
    return response.status === 400;
  } catch (error) {
    console.error('Apify connection test failed:', error);
    return false;
  }
};
