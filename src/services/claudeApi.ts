// Claude API Service
// Сервіс для роботи з Claude Sonnet 4 API

// API ключ тепер на Railway backend
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

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

interface ClaudeError {
  type: string;
  error: {
    type: string;
    message: string;
  };
}

// Функція для відправки запиту до Claude API
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

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData: ClaudeError = await response.json();
      throw new Error(`Claude API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data: ClaudeResponse = await response.json();
    
    // Повертаємо текст відповіді
    if (data.content && data.content.length > 0) {
      return data.content[0].text;
    }
    
    throw new Error('Порожня відповідь від Claude API');
    
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
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
