const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ініціалізація Supabase клієнта
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
console.log('---');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
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

// GET endpoint для отримання збережених оголошень з Supabase
app.get('/api/facebook-ads', async (req, res) => {
  try {
    const { page_id, limit = 50, offset = 0 } = req.query;
    
    console.log('=== FETCHING SAVED ADS FROM SUPABASE ===');
    console.log('Query params:', { page_id, limit, offset });
    
    let query = supabase
      .from('facebook_ads')
      .select(`
        *,
        apify_requests (
          id,
          page_id,
          country,
          request_date
        )
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    // Якщо вказано page_id, фільтруємо
    if (page_id) {
      query = query.eq('apify_requests.page_id', page_id);
    }
    
    const { data: ads, error } = await query;
    
    if (error) {
      console.error('❌ Supabase fetch error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch ads', 
        details: error.message 
      });
    }
    
    console.log(`✅ Fetched ${ads?.length || 0} ads from Supabase`);
    
    // Трансформуємо дані у формат frontend
    const transformedAds = ads.map(ad => ({
      id: ad.id,
      adArchiveId: ad.ad_archive_id,
      text: ad.title || ad.caption || 'No text',
      imageUrl: ad.media_type === 'image' ? ad.media_url : null,
      videoUrl: ad.media_type === 'video' ? ad.media_url : null,
      pageName: ad.page_name,
      adType: ad.media_type?.toUpperCase() || 'IMAGE',
      createdAt: ad.created_at,
      ctaText: ad.cta_text,
      linkUrl: ad.ad_link,
      caption: ad.caption,
      cardIndex: ad.card_index,
      vertexAnalysis: ad.vertex_analysis,
      vertexAnalyzedAt: ad.vertex_analyzed_at,
      requestInfo: ad.apify_requests
    }));
    
    res.json({
      success: true,
      ads: transformedAds,
      total: transformedAds.length,
      source: 'supabase'
    });
    
  } catch (error) {
    console.error('Fetch saved ads error:', error);
    res.status(500).json({
      error: 'Failed to fetch saved ads',
      details: error.message
    });
  }
});

// POST endpoint для аналізу конкретного оголошення через Vertex AI
app.post('/api/facebook-ads/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const { forceReanalyze = false } = req.body;
    
    console.log('=== ANALYZING AD WITH VERTEX AI ===');
    console.log('Ad ID:', id);
    console.log('Force reanalyze:', forceReanalyze);
    
    // Отримуємо оголошення з Supabase
    const { data: ad, error: fetchError } = await supabase
      .from('facebook_ads')
      .select('*')
      .eq('id', id)
      .single();
    
    console.log('📊 Fetched ad from Supabase:', {
      found: !!ad,
      error: fetchError?.message,
      ad_id: ad?.id,
      media_url: ad?.media_url,
      media_type: ad?.media_type,
      title: ad?.title
    });
    
    if (fetchError || !ad) {
      return res.status(404).json({ 
        error: 'Ad not found',
        details: fetchError?.message 
      });
    }
    
    // Перевіряємо чи вже аналізували (якщо не force)
    if (!forceReanalyze && ad.vertex_analysis) {
      console.log('✅ Ad already analyzed, returning cached result');
      return res.json({
        success: true,
        analysis: ad.vertex_analysis,
        cached: true,
        analyzedAt: ad.vertex_analyzed_at
      });
    }
    
    // Детальна перевірка media_url
    if (!ad.media_url || ad.media_url === 'null' || ad.media_url === null) {
      console.error('❌ Invalid media_url:', ad.media_url);
      return res.status(400).json({ 
        error: 'No valid media URL found for this ad',
        details: `media_url is: ${ad.media_url}`,
        ad_data: {
          id: ad.id,
          media_url: ad.media_url,
          media_type: ad.media_type,
          title: ad.title
        }
      });
    }
    
    console.log(`📹 Analyzing ${ad.media_type}: ${ad.media_url}`);
    
    let analysisResult;
    
    // Використовуємо Vertex AI Gemini для ВСЬОГО (відео І картинки)
    if (process.env.VERTEX_AI_CREDENTIALS) {
      const mediaTypeLabel = ad.media_type === 'video' ? '🎥 відео' : '🖼️ картинку';
      console.log(`Analyzing ${mediaTypeLabel} with Vertex AI Gemini 2.0 Flash...`);
      analysisResult = await analyzeMediaWithVertexAI(ad.media_url, ad.media_type, ad.title, ad.caption);
    } else if (process.env.GEMINI_API_KEY) {
      console.log(`Analyzing ${ad.media_type} with Gemini API (fallback)...`);
      analysisResult = await analyzeMediaWithGeminiAPI(ad.media_url, ad.media_type, ad.title, ad.caption);
    } else if (ad.media_type === 'image' && process.env.CLAUDE_API_KEY) {
      console.log('Analyzing image with Claude Vision (fallback)...');
      analysisResult = await analyzeImageWithClaude(ad.media_url, ad.title, ad.caption);
    } else {
      throw new Error('Analysis requires VERTEX_AI_CREDENTIALS, GEMINI_API_KEY, or CLAUDE_API_KEY');
    }
    
    console.log('✅ Analysis completed');
    
    // Зберігаємо результат в Supabase
    const { error: updateError } = await supabase
      .from('facebook_ads')
      .update({
        vertex_analysis: analysisResult,
        vertex_analyzed_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('❌ Failed to save analysis:', updateError);
      // Все одно повертаємо результат, навіть якщо не вдалося зберегти
    } else {
      console.log('💾 Analysis saved to Supabase');
    }
    
    res.json({
      success: true,
      analysis: analysisResult,
      cached: false,
      analyzedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ad analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze ad',
      details: error.message
    });
  }
});

// Helper: аналіз медіа (відео або картинки) через Vertex AI з Cloud Storage
async function analyzeMediaWithVertexAI(mediaUrl, mediaType, title, caption) {
  const { Storage } = require('@google-cloud/storage');
  const credentials = JSON.parse(process.env.VERTEX_AI_CREDENTIALS);
  const projectId = process.env.VERTEX_AI_PROJECT_ID || credentials.project_id;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
  const bucketName = process.env.GCS_BUCKET_NAME || `${projectId}-vertex-temp`;
  
  console.log(`Using Vertex AI project: ${projectId}, location: ${location}`);
  
  // Ініціалізуємо Cloud Storage
  const storage = new Storage({
    projectId: projectId,
    credentials: credentials
  });
  
  // Отримуємо OAuth2 токен для Vertex AI
  console.log('Step 1: Getting OAuth2 token...');
  const jwtToken = await createJWT(credentials);
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`
  });
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get OAuth2 token: ${errorText}`);
  }
  
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  console.log('✅ OAuth2 token obtained');
  
  // Завантажуємо медіа файл
  console.log(`Step 2: Downloading ${mediaType} from Facebook...`);
  const mediaResponse = await fetch(mediaUrl);
  if (!mediaResponse.ok) throw new Error(`Failed to download ${mediaType}`);
  
  const mediaBuffer = await mediaResponse.arrayBuffer();
  const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
  const fileExtension = mediaType === 'video' ? 'mp4' : 'jpg';
  
  console.log(`✅ Downloaded ${(mediaBuffer.byteLength / 1024).toFixed(2)} KB`);
  
  // Завантажуємо в Google Cloud Storage
  console.log('Step 3: Uploading to Google Cloud Storage...');
  const fileName = `temp/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
  
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    
    // Спробуємо завантажити файл напряму
    try {
      await file.save(Buffer.from(mediaBuffer), {
        contentType: mimeType,
        metadata: {
          cacheControl: 'public, max-age=3600',
        }
      });
    } catch (uploadError) {
      // Якщо bucket не існує (404), створюємо його
      if (uploadError.status === 404 || uploadError.code === 404) {
        console.log(`Bucket not found, creating: ${bucketName}`);
        await storage.createBucket(bucketName, {
          location: location.toUpperCase(),
          storageClass: 'STANDARD'
        });
        console.log(`✅ Bucket created: ${bucketName}`);
        
        // Повторюємо завантаження
        await file.save(Buffer.from(mediaBuffer), {
          contentType: mimeType,
          metadata: {
            cacheControl: 'public, max-age=3600',
          }
        });
      } else {
    
        throw uploadError;
      }
    }
    
    const gcsUri = `gs://${bucketName}/${fileName}`;
    console.log(`✅ Uploaded to: ${gcsUri}`);
  
  // Формуємо prompt залежно від типу медіа
  let analysisPrompt;
  if (mediaType === 'video') {
    analysisPrompt = `Проаналізуй цей рекламний відео креатив детально:
- Стиль та візуальні ефекти
- Динаміка та монтаж
- Текст на відео
- Емоції та настрій
- Call-to-action (CTA)
- Цільова аудиторія
- Що працює добре
- Рекомендації для покращення`;
  } else {
    analysisPrompt = `Проаналізуй цей рекламний креатив детально:

Заголовок: ${title || 'N/A'}
Опис: ${caption || 'N/A'}

Надай детальний аналіз:
- Візуальна композиція та дизайн
- Кольорова схема
- Текст та типографіка на зображенні
- Емоційний вплив
- Call-to-action (CTA)
- Цільова аудиторія
- Що працює добре
- Рекомендації для покращення`;
  }
  
    // Аналізуємо через Gemini з Cloud Storage URI
    console.log('Step 4: Analyzing with Gemini 2.0 Flash...');
    const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash-exp:generateContent`;
    
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [
          {
            fileData: {
              fileUri: gcsUri,
              mimeType: mimeType
            }
          },
          { text: analysisPrompt }
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
    
    console.log('Analysis response status:', analysisResponse.status);
    
    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('Vertex AI analysis error:', errorText);
      throw new Error(`Vertex AI analysis failed: ${analysisResponse.statusText}`);
    }
    
    const data = await analysisResponse.json();
    console.log('✅ Analysis completed successfully');
    
    // Видаляємо тимчасовий файл з GCS
    try {
      await file.delete();
      console.log('✅ Temporary file deleted from GCS');
    } catch (deleteError) {
      console.warn('Warning: Could not delete temporary file:', deleteError.message);
    }
    
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('Invalid Vertex AI response - no candidates');
    }
    
    return data.candidates[0].content.parts[0].text;
    
  } catch (gcsError) {
    console.error('Cloud Storage error:', gcsError);
    throw new Error(`Cloud Storage upload failed: ${gcsError.message}`);
  }
}

// Helper: аналіз медіа (відео або картинки) через Gemini API (fallback)
async function analyzeMediaWithGeminiAPI(mediaUrl, mediaType, title, caption) {
  // Завантажуємо медіа файл
  const mediaResponse = await fetch(mediaUrl);
  const mediaBuffer = await mediaResponse.arrayBuffer();
  const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
  
  // Завантажуємо в Gemini File API
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${process.env.GEMINI_API_KEY}`;
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start, upload, finalize',
      'X-Goog-Upload-Header-Content-Length': mediaBuffer.byteLength.toString(),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': mimeType
    },
    body: mediaBuffer
  });
  
  const uploadData = await uploadResponse.json();
  const fileUri = uploadData.file.uri;
  
  // Чекаємо обробки (для відео може бути довше)
  let fileState = 'PROCESSING';
  let attempts = 0;
  const maxAttempts = mediaType === 'video' ? 30 : 10;
  
  while (fileState === 'PROCESSING' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusResponse = await fetch(`${uploadData.file.name}?key=${process.env.GEMINI_API_KEY}`);
    const statusData = await statusResponse.json();
    fileState = statusData.state;
    attempts++;
  }
  
  if (fileState !== 'ACTIVE') throw new Error(`${mediaType} processing failed`);
  
  // Формуємо prompt залежно від типу медіа
  let analysisPrompt;
  if (mediaType === 'video') {
    analysisPrompt = `Проаналізуй цей рекламний відео креатив детально:
- Стиль та візуальні ефекти
- Динаміка та монтаж
- Текст на відео
- Емоції та настрій
- Call-to-action (CTA)
- Цільова аудиторія
- Що працює добре
- Рекомендації для покращення`;
  } else {
    analysisPrompt = `Проаналізуй цей рекламний креатив детально:

Заголовок: ${title || 'N/A'}
Опис: ${caption || 'N/A'}

Надай детальний аналіз:
- Візуальна композиція та дизайн
- Кольорова схема
- Текст та типографіка на зображенні
- Емоційний вплив
- Call-to-action (CTA)
- Цільова аудиторія
- Що працює добре
- Рекомендації для покращення`;
  }
  
  // Аналізуємо
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const requestBody = {
    contents: [{
      parts: [
        { fileData: { mimeType, fileUri } },
        { text: analysisPrompt }
      ]
    }]
  };
  
  const analysisResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  
  const data = await analysisResponse.json();
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('Invalid Gemini API response');
  }
  
  return data.candidates[0].content.parts[0].text;
}

// Helper: аналіз картинки через Claude Vision (fallback)
async function analyzeImageWithClaude(imageUrl, title, caption) {
  // Завантажуємо картинку та конвертуємо в base64
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  
  // Визначаємо media type
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: contentType,
              data: base64Image
            }
          },
          {
            type: 'text',
            text: `Проаналізуй цей рекламний креатив детально:

Заголовок: ${title || 'N/A'}
Опис: ${caption || 'N/A'}

Надай аналіз:
- Візуальна композиція та дизайн
- Кольорова схема
- Текст та типографіка
- Емоційний вплив
- Call-to-action (CTA)
- Цільова аудиторія
- Що працює добре
- Рекомендації для покращення`
          }
        ]
      }]
    })
  });
  
  const data = await response.json();
  
  if (!data.content || !data.content[0]) {
    throw new Error('Invalid Claude API response');
  }
  
  return data.content[0].text;
}

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

    // Крок 1: Створюємо запис про запит в Supabase
    console.log('💾 Saving request to Supabase...');
    const { data: requestData, error: requestError } = await supabase
      .from('apify_requests')
      .insert({
        page_id: pageId,
        country: country,
        count: count
      })
      .select()
      .single();

    if (requestError) {
      console.error('❌ Supabase request error:', requestError);
      throw new Error(`Failed to save request: ${requestError.message}`);
    }

    const requestId = requestData.id;
    console.log('✅ Request saved with ID:', requestId);

    // Крок 2: Перевіряємо існуючі ad_archive_id в базі
    console.log('🔍 Checking for existing ads...');
    const archiveIds = items.map(item => item.ad_archive_id).filter(Boolean);
    
    let existingAds = [];
    if (archiveIds.length > 0) {
      const { data: existing } = await supabase
        .from('facebook_ads')
        .select('ad_archive_id')
        .in('ad_archive_id', archiveIds);
      
      existingAds = existing || [];
      console.log(`Found ${existingAds.length} existing ads in database`);
    }
    
    const existingArchiveIds = new Set(existingAds.map(ad => ad.ad_archive_id));
    
    // Крок 3: Трансформуємо та зберігаємо ТІЛЬКИ НОВІ дані в Supabase
    console.log('💾 Processing ads from Apify...');
    const transformedAds = [];
    const adsToSave = [];
    const newAdsInfo = []; // Для автоматичного аналізу
    let duplicatesCount = 0;
    let processedUniqueAds = 0;

    for (const item of items) {
      // Перевіряємо чи це дублікат ПЕРЕД обробкою cards
      if (item.ad_archive_id && existingArchiveIds.has(item.ad_archive_id)) {
        duplicatesCount++;
        console.log(`⏭️ Skipping duplicate ad: ${item.ad_archive_id} (all cards ignored)`);
        continue; // Пропускаємо ВСЕ оголошення з усіма cards
      }
      
      processedUniqueAds++;
      const snapshot = item.snapshot || {};
      const cards = snapshot.cards || [];
      
      console.log(`\n✅ Processing NEW ad #${processedUniqueAds}: ${item.ad_archive_id}`);
      console.log(`   Cards count: ${cards.length}`);
      if (cards.length > 0 && cards[0].original_image_url) {
        console.log(`   Media example: ${cards[0].original_image_url.substring(0, 80)}...`);
      }
      
      // Якщо немає cards - пропускаємо (немає медіа контенту)
      if (cards.length === 0) {
        console.log(`   ⏭️ Skipping: no cards (no media content)`);
        continue;
      }
      
      // Зберігаємо кожну card окремо, але ТІЛЬКИ з медіа
      cards.forEach((card, index) => {
        const mediaUrl = card.video_hd_url || card.video_sd_url || 
                        card.resized_image_url || card.original_image_url || null;
        
        // Пропускаємо card без медіа
        if (!mediaUrl) {
          console.log(`   ⏭️ Skipping card ${index}: no media URL`);
          return;
        }
        
        const mediaType = (card.video_hd_url || card.video_sd_url) ? 'video' : 'image';
        
        const adData = {
          request_id: requestId,
          ad_archive_id: item.ad_archive_id || `no-id-${Date.now()}-${index}`,
          media_url: mediaUrl,
          media_type: mediaType,
          title: card.title || card.body || snapshot.caption || 'No title',
          ad_link: card.link_url || null,
          caption: card.caption || snapshot.caption || null,
          cta_text: card.cta_text || snapshot.cta_text || null,
          page_name: pageId, // Зберігаємо ID сторінки з інпуту
          card_index: index
        };
        
        adsToSave.push(adData);
        transformedAds.push({
          id: `${item.ad_archive_id}-${index}`,
          text: adData.title,
          imageUrl: mediaType === 'image' ? mediaUrl : (card.video_preview_image_url || null),
          videoUrl: mediaType === 'video' ? mediaUrl : null,
          pageName: adData.page_name,
          adType: mediaType.toUpperCase(),
          createdAt: item.start_date || new Date().toISOString(),
          country: country,
          pageId: item.page_id || pageId,
          ctaText: adData.cta_text,
          linkUrl: adData.ad_link,
          publisherPlatforms: item.publisher_platform || []
        });
        
        console.log(`   ✅ Added card ${index}: ${mediaType} - ${mediaUrl.substring(0, 60)}...`);
      });
    }

    // Зберігаємо всі НОВІ оголошення в Supabase
    let savedAds = [];
    
    if (adsToSave.length === 0) {
      console.log(`\n⚠️ Жодного нового креативу з медіа не знайдено!`);
      console.log(`   Отримано з Apify: ${items.length} ads`);
      console.log(`   Дублікати: ${duplicatesCount} ads`);
      console.log(`   Унікальні ads (оброблено): ${processedUniqueAds} ads`);
      console.log(`   Нові креативи з медіа: 0`);
      
      return res.json({
        success: true,
        ads: [],
        requestId: requestId,
        savedCount: 0,
        duplicatesCount: duplicatesCount,
        totalScraped: items.length,
        newAdsForAnalysis: [],
        message: duplicatesCount > 0 
          ? `Знайдено 0 унікальних креативів з медіа. Всі ${duplicatesCount} оголошень вже є в базі.`
          : `Знайдено 0 креативів з медіа. Оголошення не містять зображень або відео.`,
        source: 'apify-real'
      });
    }
    
    const { data: saved, error: adsError } = await supabase
      .from('facebook_ads')
      .insert(adsToSave)
      .select();

    if (adsError) {
      console.error('❌ Supabase ads error:', adsError);
      throw new Error(`Failed to save ads: ${adsError.message}`);
    }

    savedAds = saved || [];
    console.log(`\n✅ ПІДСУМОК:`);
    console.log(`   Отримано з Apify: ${items.length} ads`);
    console.log(`   Дублікати (пропущено): ${duplicatesCount} ads`);
    console.log(`   Унікальні ads з медіа: ${processedUniqueAds} ads`);
    console.log(`   Нові креативи (збережено): ${savedAds.length} cards з медіа`);
    
    // Зберігаємо інфо для автоматичного аналізу
    savedAds.forEach(ad => {
      if (ad.media_url) {
        newAdsInfo.push({
          id: ad.id,
          media_url: ad.media_url,
          media_type: ad.media_type,
          title: ad.title,
          caption: ad.caption
        });
      }
    });

    res.json({
      success: true,
      ads: transformedAds,
      requestId: requestId,
      savedCount: savedAds.length,
      duplicatesCount: duplicatesCount,
      totalScraped: items.length,
      uniqueAdsCount: processedUniqueAds,
      newAdsForAnalysis: newAdsInfo,
      message: `Збережено ${savedAds.length} нових креативів. Пропущено ${duplicatesCount} дублікатів.`,
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
