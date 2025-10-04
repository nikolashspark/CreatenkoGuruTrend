// Gemini API Service
// Сервіс для роботи з Gemini 2.5 Flash API через Railway backend

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'https://createnkogurutrend-production.up.railway.app';

export interface GeminiVideoAnalysis {
  text: string;
  safetyRatings?: any[];
}

// Функція для аналізу відео через Gemini 2.5 Flash
export const analyzeVideoWithGemini = async (
  videoUrl: string,
  customPrompt?: string
): Promise<string> => {
  try {
    console.log(`Analyzing video with Gemini: ${videoUrl}`);

    const response = await fetch(`${RAILWAY_API_URL}/api/gemini/analyze-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl,
        prompt: customPrompt || `Проаналізуй цей відео креатив детально:
1. Візуальний стиль та естетика
2. Динаміка та монтаж (переходи, темп)
3. Текст на відео та типографіка
4. Емоційний тон та настрій
5. Call-to-Action (CTA) елементи
6. Цільова аудиторія
7. Унікальні особливості
8. Рекомендації для покращення

Надай конкретні та практичні рекомендації.`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Railway Backend Error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();

    // Gemini повертає відповідь в форматі candidates[0].content.parts[0].text
    if (data.candidates && data.candidates.length > 0) {
      const content = data.candidates[0].content;
      if (content.parts && content.parts.length > 0) {
        return content.parts[0].text;
      }
    }

    throw new Error('Invalid response format from Gemini API');

  } catch (error: any) {
    console.error('Gemini Video Analysis Error:', error);
    throw new Error(`Gemini Analysis Error: ${error.message}`);
  }
};

// Функція для тестування Gemini підключення
export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    // Простий тест з текстовим промптом
    const response = await fetch(`${RAILWAY_API_URL}/api/gemini/analyze-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: 'https://example.com/test.mp4',
        prompt: 'test'
      })
    });

    return response.status !== 401; // Якщо не 401, значить API key є
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
};
