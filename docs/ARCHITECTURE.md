# 🏗 GuruTrend Architecture

## Загальна архітектура

GuruTrend - це full-stack додаток, побудований за принципом **клієнт-серверної архітектури** з використанням зовнішніх AI сервісів.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │              React SPA (TypeScript)                 │    │
│  │  - React Router (routing)                           │    │
│  │  - TailwindCSS (styling)                            │    │
│  │  - Fetch API (HTTP requests)                        │    │
│  └────────────────────┬───────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │ REST API
                          │ WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                   SERVER (Railway)                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Node.js + Express 5                       │    │
│  │  - REST API endpoints                               │    │
│  │  - WebSocket server (real-time)                     │    │
│  │  - Business logic                                   │    │
│  │  - Integration with external services               │    │
│  └─────┬──────┬───────┬───────┬───────┬────────────────┘    │
└────────┼──────┼───────┼───────┼───────┼─────────────────────┘
         │      │       │       │       │
         │      │       │       │       │
         ▼      ▼       ▼       ▼       ▼
    ┌────────┐ ┌────┐ ┌────┐ ┌────┐ ┌─────┐
    │Supabase│ │Apify│ │GCP │ │Claude│ │GCS│
    │ (DB)   │ │ API │ │Vertex│ │ AI  │ │   │
    └────────┘ └────┘ └────┘ └────┘ └─────┘
```

---

## Компоненти системи

### 1. Frontend (React)

**Технології:**
- React 18 (UI library)
- TypeScript (type safety)
- Vite (build tool)
- TailwindCSS (styling)
- React Router (routing)

**Основні сторінки:**

```
/                     → Generation (головна)
/competitors          → CompetitorAnalysis (аналіз Facebook Ads)
/inspiration          → PromptWizard (генерація Kling промптів)
/config               → Config (редагування промптів)
```

**Структура компонентів:**

```
src/
├── components/
│   ├── Layout.tsx        → Загальний layout
│   ├── Header.tsx        → Хедер
│   ├── Sidebar.tsx       → Бічне меню
│   └── FileUpload.tsx    → Завантаження файлів
├── pages/
│   ├── CompetitorAnalysis.tsx  → Аналіз конкурентів
│   ├── PromptWizard.tsx        → Prompt Wizard
│   └── Config.tsx              → Налаштування
└── services/
    └── apifyService.ts   → API клієнт для backend
```

---

### 2. Backend (Node.js + Express)

**Технології:**
- Node.js 18+
- Express 5
- WebSocket (ws)
- dotenv (env variables)
- @supabase/supabase-js
- @google-cloud/storage

**Основні модулі:**

```javascript
// server.js - головний файл
├── Express app initialization
├── Middleware (CORS, JSON parser)
├── API Routes
│   ├── /api/apify/facebook-ads
│   ├── /api/facebook-ads
│   ├── /api/facebook-ads/:id/analyze
│   ├── /api/prompt-wizard/generate
│   ├── /api/system-prompts
│   └── /api/analyzed-page-ids
├── Helper Functions
│   ├── analyzeMediaWithVertexAI()
│   ├── analyzeMediaWithGeminiAPI()
│   └── analyzeImageWithClaude()
└── WebSocket server
```

---

### 3. База даних (Supabase PostgreSQL)

**Таблиці:**

#### `apify_requests`
Зберігає історію запитів до Apify.

| Поле | Тип | Опис |
|------|-----|------|
| id | UUID | Primary key |
| page_id | TEXT | Facebook Page ID |
| request_date | TIMESTAMP | Дата запиту |
| total_ads_scraped | INTEGER | Кількість знайдених ads |
| status | TEXT | Статус запиту |

#### `facebook_ads`
Зберігає креативи з Facebook Ads Library.

| Поле | Тип | Опис |
|------|-----|------|
| id | UUID | Primary key |
| apify_request_id | UUID | FK → apify_requests |
| ad_archive_id | TEXT | Унікальний ID креативу (unique) |
| page_name | TEXT | Page ID |
| title | TEXT | Заголовок креативу |
| caption | TEXT | Опис креативу |
| media_url | TEXT | URL медіафайлу |
| media_type | TEXT | 'image' або 'video' |
| ad_link | TEXT | Рекламне посилання |
| vertex_analysis | TEXT | AI аналіз |
| vertex_analyzed_at | TIMESTAMP | Дата аналізу |

#### `system_prompts`
Зберігає системні промпти для AI.

| Поле | Тип | Опис |
|------|-----|------|
| id | UUID | Primary key |
| key | TEXT | Унікальний ключ (unique) |
| name | TEXT | Назва промпту |
| description | TEXT | Опис |
| prompt | TEXT | Текст промпту |
| category | TEXT | Категорія |
| is_active | BOOLEAN | Чи активний |
| updated_at | TIMESTAMP | Дата оновлення |

---

### 4. Зовнішні сервіси

#### 4.1 Apify (Facebook Ads Scraper)

**Actor:** `apify/facebook-ads-scraper`

**Призначення:** Парсинг креативів з Facebook Ads Library.

**Вхідні параметри:**
```json
{
  "searchTerms": ["page_id"],
  "resultsLimit": 50,
  "countries": ["UA"],
  "startDate": "2024-01-01"
}
```

**Вихідні дані:**
- `ad_archive_id`: Унікальний ID
- `cards`: Масив креативів (images/videos)
- `page_name`: Назва сторінки
- `ad_delivery_start_time`: Дата публікації

---

#### 4.2 Google Vertex AI (Gemini 2.0 Flash)

**Призначення:** Multimodal AI аналіз зображень та відео.

**API Endpoint:**
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:streamGenerateContent
```

**Workflow:**
1. Download media from Facebook CDN
2. Upload to Google Cloud Storage
3. Send GCS URI to Vertex AI
4. Receive AI analysis
5. Delete file from GCS
6. Save analysis to Supabase

**Аналіз включає:**
- 🎯 Key messages
- 🎨 Visual elements
- 🎬 Video structure (для відео)
- 📣 Call-to-action
- 👥 Target audience
- ⭐ Brand uniqueness

---

#### 4.3 Claude AI (Anthropic)

**Model:** `claude-sonnet-4-20250514`

**Призначення:**
1. **Trend Analysis** - аналіз трендів з Vertex AI результатів
2. **Kling Prompt Generation** - створення промптів для text-to-video

**API Endpoint:**
```
POST https://api.anthropic.com/v1/messages
```

**Workflow:**
1. Отримати Vertex AI аналізи з БД
2. Згрупувати по Page ID (якщо потрібно)
3. Відправити до Claude для trend analysis
4. Отримати згенеровані Kling промпти

---

#### 4.4 Google Cloud Storage

**Bucket:** `{PROJECT_ID}-vertex-temp`

**Призначення:** Тимчасове зберігання медіафайлів для Vertex AI.

**Lifecycle:**
- Upload → Analyze → Delete (автоматичне очищення)

---

## Data Flow

### Flow 1: Scraping Facebook Ads

```
User Input (Page ID)
     ↓
Frontend → POST /api/apify/facebook-ads
     ↓
Backend → Apify API (run scraper)
     ↓
Backend ← Apify (ads data)
     ↓
Backend → Supabase (save to facebook_ads)
     ↓
Backend → [Optional] Auto Vertex AI Analysis
     ↓
Frontend ← JSON response (saved ads)
     ↓
Display results
```

### Flow 2: AI Analysis (Vertex AI)

```
User clicks "Analyze"
     ↓
Frontend → POST /api/facebook-ads/:id/analyze
     ↓
Backend → Fetch ad from Supabase
     ↓
Backend → Download media from Facebook CDN
     ↓
Backend → Upload to Google Cloud Storage
     ↓
Backend → Vertex AI API (analyze media)
     ↓
Backend ← AI analysis result
     ↓
Backend → Delete file from GCS
     ↓
Backend → Save analysis to Supabase
     ↓
Frontend ← JSON response (analysis)
     ↓
Display analysis
```

### Flow 3: Prompt Wizard

```
User selects mode + inputs
     ↓
Frontend → POST /api/prompt-wizard/generate
     ↓
Backend → Fetch Vertex AI analyses from Supabase
     ↓
Backend → Fetch system prompts from Supabase
     ↓
Backend → Claude API (trend analysis)
     ↓
Backend ← Trend analysis
     ↓
Backend → Claude API (Kling prompt generation)
     ↓
Backend ← Kling prompts
     ↓
Frontend ← JSON response (trends + prompts)
     ↓
Display results
```

---

## Security

### Authentication & Authorization

- **Supabase**: Row Level Security (RLS) enabled
- **Backend**: Service role key (повний доступ)
- **Frontend**: Не має прямого доступу до Supabase

### API Keys

Всі API ключі зберігаються в backend `.env`:
- `CLAUDE_API_KEY`
- `APIFY_API_TOKEN`
- `VERTEX_AI_CREDENTIALS`
- `SUPABASE_SERVICE_KEY`

**Frontend не має доступу до API ключів!**

### CORS

Backend налаштований на прийом запитів тільки з дозволених доменів.

---

## Scalability

### Current Limitations

- **Apify**: Rate limits (залежить від плану)
- **Vertex AI**: Quota limits (15 requests/min по замовчуванню)
- **Claude AI**: Rate limits (залежить від tier)
- **Supabase**: 500MB storage (free tier)

### Scaling Recommendations

1. **Backend**: Deploy на Railway з auto-scaling
2. **Database**: Upgrade Supabase plan for more storage
3. **Caching**: Implement Redis for API responses
4. **Queue**: Add job queue (Bull/Bee-Queue) for long-running tasks
5. **CDN**: Use Cloudflare for static assets

---

## Monitoring & Logging

### Current Implementation

- Console logs на backend
- Browser console на frontend

### Recommended Improvements

- [ ] Add structured logging (Winston/Pino)
- [ ] Add error tracking (Sentry)
- [ ] Add performance monitoring (New Relic)
- [ ] Add analytics (Google Analytics/Mixpanel)

---

## Development Workflow

```
1. Feature Branch → 2. Development → 3. Testing → 4. PR → 5. Main → 6. Deploy
```

### Git Workflow

```bash
git checkout -b feature/new-feature
# Make changes
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create Pull Request
```

### Deployment

**Backend (Railway):**
- Auto-deploy on push to `main`
- Environment variables через Railway UI

**Frontend (Vercel):**
- Auto-deploy on push to `main`
- Environment variables через Vercel UI

---

## Future Improvements

- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Implement caching strategy
- [ ] Add user authentication
- [ ] Add multi-tenancy support
- [ ] Add analytics dashboard
- [ ] Export results to PDF/CSV
