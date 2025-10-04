// Claude API Service
// Сервіс для роботи з Claude Sonnet 4 API через WebSocket

import WebSocketService from './websocketService';

// Використовуємо Railway backend замість прямого виклику Claude API
const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'https://createnkogurutrend-production.up.railway.app';
const CLAUDE_API_URL = `${RAILWAY_API_URL}/api/claude`;

// WebSocket service instance
const wsService = new WebSocketService();

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

// Функція для відправки запиту до Claude API через WebSocket
export const generateWithClaude = async (prompt: string): Promise<string> => {
  return new Promise((resolve, reject) => {
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

    console.log('Sending WebSocket request to Railway backend');

    wsService.sendClaudeRequest(
      requestBody,
      (data: ClaudeResponse) => {
        // Повертаємо текст відповіді
        if (data.content && data.content.length > 0) {
          resolve(data.content[0].text);
        } else {
          reject(new Error('Порожня відповідь від Claude API'));
        }
      },
      (error: string) => {
        reject(new Error(`WebSocket Error: ${error}`));
      }
    );
  });
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
