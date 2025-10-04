// Claude API Service
// Сервіс для роботи з Claude Sonnet 4 API через HTTP

// Використовуємо Railway backend замість прямого виклику Claude API
const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'https://createnkogurutrend-production.up.railway.app';

// Типи для API
interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: null | string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}


// Функція для відправки запиту до Claude API через HTTP
export const generateWithClaude = async (prompt: string): Promise<string> => {
  try {
    const requestBody: ClaudeRequest = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    console.log('Sending HTTP request to Railway backend');

    const response = await fetch(`${RAILWAY_API_URL}/api/claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Railway Backend Error: ${errorData.error || response.statusText}`);
    }

    const data: ClaudeResponse = await response.json();
    
    // Повертаємо текст відповіді
    if (data.content && data.content.length > 0) {
      return data.content[0].text;
    } else {
      throw new Error('Порожня відповідь від Claude API');
    }
  } catch (error: any) {
    console.error('Claude API Error:', error);
    throw new Error(`Claude API Error: ${error.message}`);
  }
};

// Функція для тестування API ключа
export const testClaudeConnection = async (): Promise<boolean> => {
  try {
    await generateWithClaude('Hello, world');
    return true;
  } catch (error) {
    console.error('Claude connection test failed:', error);
    return false;
  }
};
