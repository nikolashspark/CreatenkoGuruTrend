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
console.log('---');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log('---');
console.log('VERTEX_AI_CREDENTIALS exists:', !!process.env.VERTEX_AI_CREDENTIALS);
console.log('VERTEX_AI_PROJECT_ID exists:', !!process.env.VERTEX_AI_PROJECT_ID);
console.log('VERTEX_AI_LOCATION exists:', !!process.env.VERTEX_AI_LOCATION);
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
    const { pageId, country = 'US', count = 10, useMock = false } = req.body;
    
    console.log('=== APIFY ENDPOINT CALLED ===');
    console.log('Request body:', JSON.stringify(req.body));
    console.log('APIFY_API_TOKEN present:', !!process.env.APIFY_API_TOKEN);
    
    if (!pageId) {
      return res.status(400).json({ error: 'Page ID is required' });
    }

    console.log(`Scraping Facebook Ads for page ${pageId} in ${country}, count: ${count} (useMock: ${useMock})`);

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

    // Використовуємо Apify Actor: curious_coder~facebook-ads-library-scraper
    console.log('Calling Apify Facebook Ads Library Scraper');
    
    if (!process.env.APIFY_API_TOKEN) {
      throw new Error('APIFY_API_TOKEN not configured');
    }

    const actorId = 'curious_coder~facebook-ads-library-scraper';
    
    // Формуємо URL для Facebook Ads Library згідно з документацією Actor
    const facebookAdsUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&view_all_page_id=${pageId}&search_type=page&media_type=all`;
    
    const input = {
      urls: [
        {
          url: facebookAdsUrl
        }
      ],
      count: Math.max(10, count), // Мінімум 10 згідно з вимогами Actor
      "scrapePageAds.activeStatus": "active",
      "scrapePageAds.countryCode": country
    };

    console.log('Sending request to Apify API...');
    console.log('Actor ID:', actorId);
    console.log('Facebook Ads URL:', facebookAdsUrl);
    console.log('Input:', JSON.stringify(input, null, 2));
    
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
      },
      body: JSON.stringify(input)
    });

    console.log('Apify API response status:', runResponse.status);
    
    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify API error:', errorText);
      throw new Error(`Apify API Error: ${runResponse.statusText}`);
    }

    const items = await runResponse.json();
    console.log(`Received ${items.length} items from Apify`);
    console.log('First item sample:', JSON.stringify(items[0], null, 2));

    // Перевіряємо чи є помилка в відповіді
    if (items.length > 0 && items[0].error) {
      throw new Error(`Apify Actor Error: ${items[0].error}`);
    }

    if (items.length === 0) {
      throw new Error('No ads found for this page');
    }

    // Трансформуємо дані згідно з реальною структурою Apify
    const transformedAds = items.map((item) => {
      const snapshot = item.snapshot || {};
      const firstCard = snapshot.cards?.[0] || {};
      
      return {
        id: item.ad_archive_id || Math.random().toString(36).substr(2, 9),
        text: firstCard.body || firstCard.title || snapshot.caption || 'No text available',
        imageUrl: firstCard.resized_image_url || firstCard.original_image_url || firstCard.video_preview_image_url || null,
        videoUrl: firstCard.video_hd_url || firstCard.video_sd_url || null,
        pageName: snapshot.page_name || pageId,
        adType: firstCard.video_hd_url ? 'VIDEO' : 'IMAGE',
        createdAt: item.start_date || new Date().toISOString(),
        country: country,
        pageId: item.page_id || pageId,
        // Додаткові дані для аналізу
        ctaText: firstCard.cta_text || snapshot.cta_text || null,
        linkUrl: firstCard.link_url || null,
        publisherPlatforms: item.publisher_platform || []
      };
    });

    res.json({
      success: true,
      ads: transformedAds,
      source: 'apify-real'
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

// Vertex AI endpoint для аналізу відео
app.post('/api/vertex/analyze-video', async (req, res) => {
  try {
    console.log('Received request to Vertex AI for video analysis');

    if (!process.env.VERTEX_AI_CREDENTIALS) {
      return res.status(401).json({ error: 'VERTEX_AI_CREDENTIALS not configured' });
    }

    const { videoUrl, prompt } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }

    // Parse Service Account credentials
    const credentials = JSON.parse(process.env.VERTEX_AI_CREDENTIALS);
    const projectId = process.env.VERTEX_AI_PROJECT_ID || credentials.project_id;
    const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

    console.log('Step 1: Getting OAuth2 access token...');

    // Отримуємо OAuth2 токен
    const jwtToken = await createJWT(credentials);
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get OAuth2 token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('Step 2: Downloading video from:', videoUrl);

    // Завантажуємо відео
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    console.log(`Video downloaded: ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

    console.log('Step 3: Uploading video to Vertex AI File API...');

    // Завантажуємо відео через File API (resumable upload)
    const uploadUrl = `https://${location}-aiplatform.googleapis.com/upload/v1/projects/${projectId}/locations/${location}/files`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start, upload, finalize',
        'X-Goog-Upload-Header-Content-Length': videoBuffer.byteLength.toString(),
        'X-Goog-Upload-Header-Content-Type': 'video/mp4',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: {
          display_name: 'facebook_ad_video.mp4'
        }
      })
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('File upload metadata error:', errorText);
      throw new Error(`Failed to start upload: ${uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();
    
    // Тепер завантажуємо сам файл
    const uploadSessionUrl = uploadResponse.headers.get('x-goog-upload-url');
    if (!uploadSessionUrl) {
      throw new Error('No upload session URL received');
    }

    const fileUploadResponse = await fetch(uploadSessionUrl, {
      method: 'POST',
      headers: {
        'Content-Length': videoBuffer.byteLength.toString(),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize'
      },
      body: videoBuffer
    });

    if (!fileUploadResponse.ok) {
      const errorText = await fileUploadResponse.text();
      console.error('File upload error:', errorText);
      throw new Error(`Failed to upload video: ${fileUploadResponse.statusText}`);
    }

    const fileData = await fileUploadResponse.json();
    const fileUri = fileData.file.uri;
    console.log('Video uploaded, URI:', fileUri);

    console.log('Step 4: Analyzing video with Vertex AI Gemini...');

    // Викликаємо Vertex AI з fileUri
    const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash-exp:generateContent`;

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: 'video/mp4',
              fileUri: fileUri
            }
          },
          {
            text: prompt || "Проаналізуй цей відео креатив детально: стиль, динаміка, візуальні ефекти, текст на відео, емоції, CTA, цільова аудиторія. Надай конкретні рекомендації."
          }
        ]
      }]
    };

    const analysisResponse = await fetch(vertexUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json();
      console.error('Vertex AI Error:', errorData);
      throw new Error(`Vertex AI Error: ${errorData.error?.message || analysisResponse.statusText}`);
    }

    const data = await analysisResponse.json();
    console.log('Vertex AI analysis completed successfully');

    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      error: 'Failed to analyze video with Vertex AI',
      details: error.message
    });
  }
});

// Helper function для створення JWT для Google OAuth2
async function createJWT(credentials) {
  const crypto = require('crypto');
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64url');

  return `${signatureInput}.${signature}`;
}

// Gemini API proxy endpoint для аналізу відео через File API (fallback)
app.post('/api/gemini/analyze-video', async (req, res) => {
  try {
    console.log('Received request to Gemini API for video analysis');

    if (!process.env.GEMINI_API_KEY) {
      return res.status(401).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const { videoUrl, prompt } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }

    console.log('Step 1: Downloading video from:', videoUrl);

    // Крок 1: Завантажити відео з Facebook
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoSize = videoBuffer.byteLength;
    console.log(`Video downloaded: ${(videoSize / 1024 / 1024).toFixed(2)} MB`);

    // Крок 2: Завантажити відео в Gemini File API (resumable upload)
    console.log('Step 2: Uploading video to Gemini File API...');
    
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${process.env.GEMINI_API_KEY}`;
    
    // Спочатку відправляємо metadata + відео одним запитом
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start, upload, finalize',
        'X-Goog-Upload-Header-Content-Length': videoSize.toString(),
        'X-Goog-Upload-Header-Content-Type': 'video/mp4',
        'Content-Type': 'video/mp4'
      },
      body: videoBuffer
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error('File API Upload Error:', errorData);
      throw new Error(`Failed to upload video: ${uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();
    const fileUri = uploadData.file.uri;
    console.log('Video uploaded to File API:', fileUri);

    // Крок 3: Чекаємо поки відео обробиться
    console.log('Step 3: Waiting for video processing...');
    let fileState = 'PROCESSING';
    let attempts = 0;
    const maxAttempts = 30; // 30 секунд

    while (fileState === 'PROCESSING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`${uploadData.file.name}?key=${process.env.GEMINI_API_KEY}`);
      const statusData = await statusResponse.json();
      fileState = statusData.state;
      
      console.log(`File state: ${fileState} (attempt ${attempts + 1}/${maxAttempts})`);
      attempts++;
    }

    if (fileState !== 'ACTIVE') {
      throw new Error(`Video processing failed: ${fileState}`);
    }

    // Крок 4: Аналізуємо відео через Gemini 2.0 Flash
    console.log('Step 4: Analyzing video with Gemini 2.0 Flash...');
    
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const requestBody = {
      contents: [{
        parts: [
          {
            fileData: {
              mimeType: "video/mp4",
              fileUri: fileUri
            }
          },
          {
            text: prompt || "Проаналізуй цей відео креатив детально: стиль, динаміка, візуальні ефекти, текст на відео, емоції, CTA, цільова аудиторія. Надай конкретні рекомендації."
          }
        ]
      }]
    };

    const analysisResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json();
      console.error('Gemini Analysis Error:', errorData);
      throw new Error(`Gemini API Error: ${errorData.error?.message || analysisResponse.statusText}`);
    }

    const data = await analysisResponse.json();
    console.log('Gemini analysis completed successfully');

    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      error: 'Failed to analyze video',
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
