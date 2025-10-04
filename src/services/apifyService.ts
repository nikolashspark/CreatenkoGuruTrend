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
  country: string = 'US'
): Promise<FacebookAdData[]> => {
  try {
    console.log(`Scraping Facebook Ads for page ${pageId} in ${country}`);

    const response = await fetch(`${RAILWAY_API_URL}/api/apify/facebook-ads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageId,
        country,
        useMock: false // Завжди використовуємо реальний Apify API
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
