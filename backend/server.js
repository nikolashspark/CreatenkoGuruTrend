const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Діагностика API ключа
console.log('=== CLAUDE API KEY DIAGNOSTICS ===');
console.log('CLAUDE_API_KEY exists:', !!process.env.CLAUDE_API_KEY);
console.log('CLAUDE_API_KEY length:', process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.length : 0);
console.log('CLAUDE_API_KEY starts with sk-:', process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.startsWith('sk-') : false);
console.log('================================');

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'https://createnko-guru-trend.vercel.app'],
  credentials: true
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

// Apify Facebook Ads Scraper endpoint
app.post('/api/apify/facebook-ads', async (req, res) => {
  try {
    const { pageId, country = 'US' } = req.body;
    
    if (!pageId) {
      return res.status(400).json({ error: 'Page ID is required' });
    }

    console.log(`Scraping Facebook Ads for page ${pageId} in ${country}`);

    const input = {
      queries: [`Facebook ads page ${pageId}`],
      maxItems: 5,
    };

    // Запускаємо Apify Actor (використовуємо Google Search Scraper для тестування)
    const runResponse = await fetch('https://api.apify.com/v2/acts/apify~google-search-scraper/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`,
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
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/apify~google-search-scraper/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`,
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
    const datasetResponse = await fetch(`https://api.apify.com/v2/acts/apify~google-search-scraper/runs/${runId}/dataset/items`, {
      headers: {
        'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`,
      }
    });

    if (!datasetResponse.ok) {
      throw new Error('Failed to fetch dataset items');
    }

    const items = await datasetResponse.json();

    // Трансформуємо дані в наш формат
    const transformedAds = items.slice(0, 5).map((item) => ({
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

    res.json({
      success: true,
      ads: transformedAds,
      runId: runId
    });

  } catch (error) {
    console.error('Apify Facebook Ads Error:', error);
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
