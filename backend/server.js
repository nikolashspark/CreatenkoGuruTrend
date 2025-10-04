const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Діагностика API ключів
console.log('=== API KEYS DIAGNOSTICS ===');
console.log('CLAUDE_API_KEY exists:', !!process.env.CLAUDE_API_KEY);
console.log('CLAUDE_API_KEY length:', process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.length : 0);
console.log('CLAUDE_API_KEY starts with sk-:', process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.startsWith('sk-') : false);
console.log('---');
console.log('APIFY_API_TOKEN exists:', !!process.env.APIFY_API_TOKEN);
console.log('APIFY_API_TOKEN length:', process.env.APIFY_API_TOKEN ? process.env.APIFY_API_TOKEN.length : 0);
console.log('APIFY_API_TOKEN starts with apify_:', process.env.APIFY_API_TOKEN ? process.env.APIFY_API_TOKEN.startsWith('apify_') : false);
console.log('================================');

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Middleware
// Дозволяємо localhost для розробки і Vercel для продакшену
const allowedOrigins = [
  'https://createnko-guru-trend.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178'
];

app.use(cors({
  origin: function (origin, callback) {
    // Дозволяємо запити без origin (наприклад, mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      // Не блокуємо повністю, просто не дозволяємо
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API key check endpoint
app.get('/api/check-key', (req, res) => {
  res.json({
    hasKey: !!process.env.CLAUDE_API_KEY,
    keyLength: process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.length : 0,
    startsWithSk: process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.startsWith('sk-') : false,
    firstChars: process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.substring(0, 10) + '...' : 'No key'
  });
});

// Test endpoint для перевірки Apify конфігурації
app.get('/api/apify/facebook-ads', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Use POST method to scrape Facebook Ads',
    apifyTokenPresent: !!process.env.APIFY_API_TOKEN,
    apifyTokenLength: process.env.APIFY_API_TOKEN ? process.env.APIFY_API_TOKEN.length : 0,
    endpoint: 'POST /api/apify/facebook-ads',
    requiredFields: ['pageId', 'country (optional)'],
    example: {
      pageId: '161970940341938',
      country: 'US'
    }
  });
});

// Facebook Ads Scraper endpoint через MCP
app.post('/api/apify/facebook-ads', async (req, res) => {
  try {
    const { pageId, country = 'US', useMock = false } = req.body;
    
    console.log('=== APIFY ENDPOINT CALLED ===');
    console.log('Request body:', JSON.stringify(req.body));
    console.log('APIFY_API_TOKEN present:', !!process.env.APIFY_API_TOKEN);
    
    if (!pageId) {
      return res.status(400).json({ error: 'Page ID is required' });
    }

    console.log(`Scraping Facebook Ads for page ${pageId} in ${country} (useMock: ${useMock})`);

    // Якщо useMock=true, використовуємо мок-дані
    if (useMock) {
      const mockAds = [
        {
          id: "1",
          text: "🔥 Новий продукт! Замовляйте зараз зі знижкою 50%!",
          imageUrl: "https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Ad+1",
          pageName: "Competitor Brand",
          adType: "IMAGE",
          createdAt: "2025-10-01T10:00:00Z",
          country: country,
          pageId: pageId,
        },
        {
          id: "2", 
          text: "Відео про наш продукт - подивіться, як він працює!",
          videoUrl: "https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Video+Ad",
          pageName: "Competitor Brand",
          adType: "VIDEO",
          createdAt: "2025-09-28T15:30:00Z",
          country: country,
          pageId: pageId,
        },
        {
          id: "3",
          text: "Обмежена пропозиція! Тільки сьогодні знижка 30%",
          imageUrl: "https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=Ad+3",
          pageName: "Competitor Brand",
          adType: "IMAGE",
          createdAt: "2025-09-25T08:15:00Z",
          country: country,
          pageId: pageId,
        },
        {
          id: "4",
          text: "Відгуки клієнтів про наш сервіс",
          imageUrl: "https://via.placeholder.com/300x200/96CEB4/FFFFFF?text=Testimonial",
          pageName: "Competitor Brand",
          adType: "IMAGE",
          createdAt: "2025-09-20T14:45:00Z",
          country: country,
          pageId: pageId,
        },
        {
          id: "5",
          text: "Реєструйтеся на вебінар завтра о 19:00",
          imageUrl: "https://via.placeholder.com/300x200/FFEAA7/FFFFFF?text=Webinar",
          pageName: "Competitor Brand",
          adType: "IMAGE",
          createdAt: "2025-09-18T11:20:00Z",
          country: country,
          pageId: pageId,
        }
      ];

      return res.json({
        success: true,
        ads: mockAds,
        runId: `mock-${Date.now()}`,
        source: 'mock'
      });
    }

    // Використовуємо Apify HTTP API напряму
    console.log('Calling Apify HTTP API for Facebook Ads');
    
    if (!process.env.APIFY_API_TOKEN) {
      throw new Error('APIFY_API_TOKEN not configured');
    }

    // Запускаємо Apify Actor через HTTP API
    // Використовуємо правильний Actor ID з тильдою
    const actorId = 'apify~facebook-ads-scraper';
    
    // Правильний формат input для Facebook Ads Scraper
    const input = {
      queries: [
        {
          query: `page_id:${pageId}`,
          country: country
        }
      ],
      maxItems: 5,
      adStatus: "ACTIVE"
    };

    console.log('Sending request to Apify API...');
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });

    console.log('Apify API response status:', runResponse.status);
    
    if (!runResponse.ok) {
      const errorData = await runResponse.json();
      console.error('Apify API error:', JSON.stringify(errorData));
      throw new Error(`Apify API Error: ${errorData.error?.message || runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    const defaultDatasetId = runData.data.defaultDatasetId;

    console.log(`Apify Actor started: ${runId}`);

    // Чекаємо завершення (максимум 2 хвилини)
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 24; // 2 хвилини (24 * 5 секунд)

    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 секунд
      
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
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

    // Отримуємо результати з dataset
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${defaultDatasetId}/items`, {
      headers: {
        'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
      }
    });

    if (!datasetResponse.ok) {
      throw new Error('Failed to fetch dataset items');
    }

    const items = await datasetResponse.json();

    // Трансформуємо дані
    const transformedAds = items.slice(0, 5).map((item) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      text: item.text || item.adText || item.body || 'No text available',
      imageUrl: item.imageUrl || item.thumbnail || null,
      videoUrl: item.videoUrl || null,
      pageName: item.pageName || 'Unknown Page',
      adType: item.format || 'Unknown',
      createdAt: item.startDate || new Date().toISOString(),
      country: country,
      pageId: pageId
    }));

    res.json({
      success: true,
      ads: transformedAds,
      runId: runId,
      source: 'apify-api'
    });

  } catch (error) {
    console.error('Facebook Ads Error:', error);
    res.status(500).json({
      error: 'Failed to scrape Facebook Ads',
      details: error.message
    });
  }
});

// Claude API proxy endpoint
app.post('/api/claude', async (req, res) => {
  try {
    console.log('Received request to Claude API:', req.body);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API Error:', errorData);
      return res.status(response.status).json({
        error: `Claude API Error: ${errorData.error?.message || response.statusText}`
      });
    }

    const data = await response.json();
    console.log('Claude API Response:', data);
    
    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      error: 'Failed to fetch from Claude API',
      details: error.message
    });
  }
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received WebSocket message:', data);
      
      if (data.type === 'claude_request') {
        // Log API key status for debugging
        console.log('🔑 API Key status:', process.env.CLAUDE_API_KEY ? 'Present' : 'Missing');
        console.log('🔑 API Key length:', process.env.CLAUDE_API_KEY?.length || 0);
        
        // Send request to Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify(data.payload)
        });
        
        if (response.ok) {
          const claudeData = await response.json();
          ws.send(JSON.stringify({
            type: 'claude_response',
            data: claudeData
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Claude API request failed'
          }));
        }
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Claude API proxy: http://localhost:${PORT}/api/claude`);
  console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);
  console.log(`🔑 API Key status: ${process.env.CLAUDE_API_KEY ? 'Present' : 'Missing'}`);
  console.log(`🔑 API Key length: ${process.env.CLAUDE_API_KEY?.length || 0}`);
});

module.exports = app;
