# 🚀 Deployment Guide - Як розгорнути GuruTrend

Цей документ допоможе вам розгорнути власну копію GuruTrend з нуля.

---

## 📋 Зміст

- [Огляд архітектури](#-огляд-архітектури)
- [Необхідні сервіси](#-необхідні-сервіси)
- [Крок 1: База даних (Supabase)](#крок-1-база-даних-supabase)
- [Крок 2: Налаштування Google Cloud](#крок-2-налаштування-google-cloud)
- [Крок 3: Backend (Railway)](#крок-3-backend-railway)
- [Крок 4: Frontend (Vercel)](#крок-4-frontend-vercel)
- [Крок 5: Тестування](#крок-5-тестування)

---

## 🏗 Огляд архітектури

GuruTrend складається з трьох основних компонентів:

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │  ────>  │   Backend    │  ────>  │  Supabase   │
│  (Vercel)   │         │  (Railway)   │         │     (DB)    │
└─────────────┘         └──────┬───────┘         └─────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                ┌───▼───┐  ┌───▼───┐  ┌──▼─────┐
                │ Apify │  │ GCP   │  │Claude  │
                │(Scrape│  │Vertex │  │  AI    │
                │  FB)  │  │  AI)  │  │(Prompts│
                └───────┘  └───────┘  └────────┘
```

### Які сервіси використовуються?

| Сервіс | Призначення | Вартість |
|--------|-------------|----------|
| **Vercel** | Хостинг фронтенду | Безкоштовно |
| **Railway** | Хостинг backend API | $5/міс |
| **Supabase** | PostgreSQL база даних | Безкоштовно (до 500MB) |
| **Apify** | Скрапінг Facebook Ads Library | ~$49/міс (платформа) |
| **Google Cloud (Vertex AI)** | AI аналіз відео/зображень через Gemini 2.0 Flash | Pay-as-you-go |
| **Claude AI (Anthropic)** | Аналіз трендів та генерація Kling промптів | Pay-as-you-go |

---

## 🔧 Необхідні сервіси

Перед початком створіть облікові записи на:

1. ✅ [Vercel](https://vercel.com/) - для frontend
2. ✅ [Railway](https://railway.app/) - для backend
3. ✅ [Supabase](https://supabase.com/) - для бази даних
4. ✅ [Apify](https://apify.com/) - для скрапінгу Facebook Ads
5. ✅ [Google Cloud Platform](https://cloud.google.com/) - для Vertex AI (Gemini)
6. ✅ [Anthropic](https://www.anthropic.com/) - для Claude API

---

## Крок 1: База даних (Supabase)

### 1.1 Створення проекту

1. Зареєструйтесь на [Supabase](https://supabase.com/)
2. Створіть новий проект
3. Оберіть регіон (рекомендуємо найближчий до вас)
4. Збережіть Database Password

### 1.2 Створення таблиць

У Supabase Dashboard перейдіть до **SQL Editor** та виконайте файл `database/schema.sql`:

```sql
-- Виконайте весь вміст файла database/schema.sql
```

Після цього виконайте `database/system_prompts.sql` для заповнення початкових промптів.

### 1.3 Структура бази даних

Буде створено 3 таблиці:

#### 📊 `apify_requests`
**Призначення:** Зберігає історію запитів до Apify для парсингу Facebook Ads

| Поле | Опис |
|------|------|
| `id` | Унікальний ID запиту |
| `page_id` | Facebook Page ID який скрапили |
| `request_date` | Дата та час запиту |
| `total_ads_scraped` | Скільки креативів знайдено |
| `status` | Статус виконання |

#### 🎨 `facebook_ads`
**Призначення:** Зберігає креативи (відео/зображення) з Facebook Ads Library та результати їх AI-аналізу

| Поле | Опис |
|------|------|
| `id` | Унікальний ID креативу в нашій БД |
| `ad_archive_id` | ID креативу з Facebook (для дедуплікації) |
| `page_name` | Page ID (наприклад, "161970940341938") |
| `title` | Заголовок креативу |
| `caption` | Текстовий опис креативу |
| `media_url` | Посилання на відео або зображення |
| `media_type` | `'image'` або `'video'` |
| `ad_link` | Рекламне посилання |
| `vertex_analysis` | **Результат AI-аналізу від Google Vertex AI (Gemini)** |
| `vertex_analyzed_at` | Коли був проведений аналіз |

#### 📝 `system_prompts`
**Призначення:** Зберігає системні промпти для AI (можна редагувати через UI)

| Поле | Опис |
|------|------|
| `key` | Унікальний ключ (`TREND_ANALYSIS_PROMPT`, `KLING_OPTIMIZER_PROMPT`) |
| `name` | Назва промпту |
| `prompt` | Текст промпту для Claude AI |
| `is_active` | Чи активний промпт |

### 1.4 Отримання API ключів

Перейдіть до **Settings** → **API**:

- Скопіюйте **URL** (Project URL)
- Скопіюйте **service_role key** ⚠️ **НЕ anon key!**

Збережіть ці дані для Railway (Backend).

---

## Крок 2: Налаштування Google Cloud

### 2.1 Створення проекту

1. Перейдіть на [Google Cloud Console](https://console.cloud.google.com/)
2. Створіть новий проект або оберіть існуючий
3. Запам'ятайте **Project ID**

### 2.2 Увімкнення API

Виконайте в Cloud Shell або локально (якщо встановлено `gcloud`):

```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
```

Або увімкніть вручну:
- **Vertex AI API**
- **Cloud Storage API**

### 2.3 Створення Service Account

1. Перейдіть до **IAM & Admin** → **Service Accounts**
2. Натисніть **Create Service Account**
3. Введіть назву (наприклад: `vertex-express`)
4. Надайте ролі:
   - ✅ **Vertex AI User** (`roles/aiplatform.user`)
   - ✅ **Storage Admin** (`roles/storage.admin`)
5. Натисніть **Done**

### 2.4 Створення JSON ключа

1. Клікніть на створений Service Account
2. Перейдіть до вкладки **Keys**
3. **Add Key** → **Create new key** → **JSON**
4. Завантажиться файл `.json`

### 2.5 Підготовка credentials для Railway

Відкрийте завантажений JSON файл та **скопіюйте весь вміст як одну строку**.

Збережіть:
- **Project ID** (з JSON або консолі)
- **Location** (рекомендуємо `us-central1`)
- **JSON вміст** (для змінної `VERTEX_AI_CREDENTIALS`)

---

## Крок 3: Backend (Railway)

### 3.1 Fork та клонування

1. **Fork** цей репозиторій на GitHub
2. Клонуйте ваш fork:

```bash
git clone https://github.com/YOUR_USERNAME/GuruTrend.git
cd GuruTrend
```

### 3.2 Створення проекту на Railway

1. Зареєструйтесь на [Railway](https://railway.app/)
2. Натисніть **New Project** → **Deploy from GitHub repo**
3. Оберіть ваш fork `GuruTrend`
4. Railway автоматично визначить Node.js проект

### 3.3 Налаштування Root Directory

⚠️ **ВАЖЛИВО:** Backend знаходиться в теці `backend/`

1. У Railway перейдіть до **Settings**
2. Знайдіть **Root Directory**
3. Встановіть: `backend`
4. Збережіть зміни

### 3.4 Додавання Environment Variables

У Railway перейдіть до **Variables** та додайте:

#### 📋 Список змінних для Railway:

```env
# Apify API (для скрапінгу Facebook Ads)
APIFY_API_TOKEN=apify_api_YOUR_TOKEN_HERE

# Claude API (для аналізу трендів та генерації промптів)
CLAUDE_API_KEY=sk-ant-api03-YOUR_KEY_HERE

# Supabase (база даних)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Vertex AI (для AI-аналізу відео/зображень)
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"..."}
```

#### Де отримати кожен ключ?

| Змінна | Де отримати |
|--------|-------------|
| `APIFY_API_TOKEN` | [Apify Console](https://console.apify.com/account/integrations) → Personal API Token |
| `CLAUDE_API_KEY` | [Anthropic Console](https://console.anthropic.com/) → API Keys |
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Settings → API → **service_role key** |
| `VERTEX_AI_PROJECT_ID` | Google Cloud Console → Project ID |
| `VERTEX_AI_LOCATION` | Використовуйте `us-central1` |
| `VERTEX_AI_CREDENTIALS` | Весь JSON вміст Service Account ключа (як одна строка) |

### 3.5 Deployment

Railway автоматично задеплоїть проект після додавання змінних.

Перевірте логи на наявність:
```
✅ Server running on port 3000
✅ CLAUDE_API_KEY exists: true
✅ SUPABASE_URL exists: true
```

### 3.6 Отримання Backend URL

У Railway знайдіть розділ **Settings** → **Domains**:
- Скопіюйте згенерований URL (наприклад: `https://your-app.up.railway.app`)
- Збережіть для Vercel (Frontend)

## Крок 4: Frontend (Vercel)

### 4.1 Створення проекту на Vercel

1. Зареєструйтесь на [Vercel](https://vercel.com/)
2. Натисніть **Add New** → **Project**
3. Імпортуйте ваш GitHub репозиторій `GuruTrend`
4. Vercel автоматично визначить Vite проект

### 4.2 Налаштування Build Settings

Vercel має автоматично визначити:
- **Framework Preset:** Vite
- **Root Directory:** `./` (корінь проекту)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

⚠️ **НЕ змінюйте Root Directory!** Frontend знаходиться в корені, на відміну від backend.

### 4.3 Додавання Environment Variables

У Vercel перейдіть до **Settings** → **Environment Variables** та додайте:

#### 📋 Список змінних для Vercel:

```env
# Backend API URL (з Railway)
VITE_RAILWAY_API_URL=https://your-app.up.railway.app

# Apify API (для прямих запитів з фронтенду, якщо потрібно)
VITE_APIFY_API_TOKEN=apify_api_YOUR_TOKEN_HERE

# Claude API (для прямих запитів з фронтенду, якщо потрібно)
VITE_CLAUDE_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

#### Пояснення змінних:

| Змінна | Призначення | Обов'язкова? |
|--------|-------------|--------------|
| `VITE_RAILWAY_API_URL` | URL backend API з Railway | ✅ Так |
| `VITE_APIFY_API_TOKEN` | Apify токен для фронтенду | ⚠️ Опціонально* |
| `VITE_CLAUDE_API_KEY` | Claude ключ для фронтенду | ⚠️ Опціонально* |

> **Примітка:** `VITE_APIFY_API_TOKEN` та `VITE_CLAUDE_API_KEY` використовуються тільки якщо ви хочете робити прямі запити до цих сервісів з фронтенду (не рекомендується з міркувань безпеки). Основна логіка працює через backend.

### 4.4 Deployment

1. Натисніть **Deploy**
2. Vercel автоматично побудує та задеплоїть проект
3. Дочекайтесь завершення (зазвичай 1-2 хвилини)

### 4.5 Отримання Frontend URL

Після деплою Vercel надасть URL:
- Production: `https://your-project.vercel.app`
- Можете налаштувати custom domain у **Settings** → **Domains**

---

## Крок 5: Тестування

### 5.1 Перевірка Backend

Відкрийте у браузері:
```
https://your-app.up.railway.app/health
```

Має повернути:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 5.2 Перевірка Frontend

1. Відкрийте `https://your-project.vercel.app`
2. Має завантажитись головна сторінка GuruTrend
3. Перевірте бічне меню (Sidebar) - має бути 4 пункти:
   - 📊 Generation
   - 🔍 Аналіз Page ID
   - 🪄 Prompt Wizard
   - ⚙️ Config

### 5.3 Тестування функціоналу

#### Тест 1: Аналіз Page ID (Facebook Ads)

1. Перейдіть на вкладку **"Аналіз Page ID"**
2. Введіть Facebook Page ID (наприклад: `161970940341938`)
3. Натисніть **"🔍 Знайти креативи"**
4. Дочекайтесь результатів

**Очікуваний результат:**
- Список креативів з превʼю (зображення/відео)
- Кожен креатив має кнопку **"🤖 Аналізувати"**

#### Тест 2: AI Аналіз (Vertex AI Gemini)

1. У списку знайдених креативів натисніть **"🤖 Аналізувати"**
2. Дочекайтесь завершення аналізу (може зайняти 10-30 секунд)

**Очікуваний результат:**
- Під креативом з'явиться детальний текстовий аналіз
- Аналіз включає: ключові повідомлення, візуальні елементи, CTA, цільову аудиторію

#### Тест 3: Prompt Wizard

1. Перейдіть на вкладку **"Prompt Wizard"**
2. Оберіть режим:
   - **Режим 1:** "💡 Тільки ідея" - введіть свою ідею креативу
   - **Режим 2:** "🌍 Всі тренди" - залишіть Page ID порожнім
   - **Режим 3:** "📌 Фіксований Page ID" - оберіть зі списку
3. Натисніть **"🪄 Генерувати промпти"**

**Очікуваний результат:**
- Розділ **"📊 Аналіз трендів"** (для режимів 2 та 3)
- Розділ **"🎬 Згеноровані Kling AI промпти"**:
  - Starting Frame
  - Final Frame
  - Kling Prompt
  - Пояснення

#### Тест 4: Config

1. Перейдіть на вкладку **"Config"**
2. Спробуйте відредагувати один з промптів
3. Натисніть **"💾 Зберегти"**

**Очікуваний результат:**
- Повідомлення про успішне збереження
- Зміни відразу застосовуються до Prompt Wizard

---

## 🔍 Troubleshooting

### Проблема: "Failed to fetch" на фронтенді

**Причина:** Frontend не може з'єднатись з backend

**Рішення:**
1. Перевірте `VITE_RAILWAY_API_URL` у Vercel Environment Variables
2. Переконайтесь що Railway backend запущено (перевірте логи)
3. Перевірте CORS налаштування в `backend/server.js`

---

### Проблема: "Invalid API key" при аналізі креативів

**Причина:** Неправильний `CLAUDE_API_KEY` або `VERTEX_AI_CREDENTIALS`

**Рішення:**
1. Перевірте Railway Environment Variables
2. Переконайтесь що ключі починаються з:
   - `CLAUDE_API_KEY`: `sk-ant-...`
   - `APIFY_API_TOKEN`: `apify_api_...`
3. Перезапустіть Railway deployment

---

### Проблема: "Permission denied" від Vertex AI

**Причина:** Service Account не має необхідних ролей

**Рішення:**
1. Перейдіть до Google Cloud Console → IAM
2. Знайдіть ваш Service Account
3. Переконайтесь що є ролі:
   - ✅ `Vertex AI User`
   - ✅ `Storage Admin`
4. Якщо ролей немає - додайте їх

---

### Проблема: Supabase "Invalid API key"

**Причина:** Використано `anon` key замість `service_role`

**Рішення:**
1. У Supabase Dashboard → Settings → API
2. Скопіюйте **service_role key** (НЕ anon!)
3. Оновіть `SUPABASE_SERVICE_KEY` у Railway
4. Перезапустіть deployment

---

## 🎯 Як працює система (Data Flow)

### 1. Скрапінг Facebook Ads

```
Користувач вводить Page ID
      ↓
Frontend → Backend (Railway)
      ↓
Backend → Apify API (скрапінг Facebook Ads Library)
      ↓
Backend отримує креативи (відео/зображення)
      ↓
Backend → Supabase (зберігає в facebook_ads)
      ↓
Frontend ← Список креативів
```

**Що відбувається в Apify?**
- Apify використовує [Facebook Ads Scraper](https://apify.com/apify/facebook-ads-scraper)
- Парсить публічну Facebook Ads Library
- Витягує відео, зображення, тексти, посилання

---

### 2. AI Аналіз креативу

```
Користувач натискає "Аналізувати"
      ↓
Frontend → Backend (Railway)
      ↓
Backend завантажує медіа з Facebook CDN
      ↓
Backend → Google Cloud Storage (тимчасове зберігання)
      ↓
Backend → Vertex AI Gemini 2.0 Flash (multimodal аналіз)
      ↓
Backend отримує AI-аналіз (текст)
      ↓
Backend видаляє файл з GCS
      ↓
Backend → Supabase (зберігає в vertex_analysis)
      ↓
Frontend ← Аналіз креативу
```

**Що робить Vertex AI Gemini?**
- Аналізує візуальний контент (відео або зображення)
- Розпізнає ключові повідомлення
- Визначає цільову аудиторію
- Аналізує композицію та стиль
- Виявляє заклики до дії (CTA)

---

### 3. Генерація Kling промптів

```
Користувач обирає режим + вводить дані
      ↓
Frontend → Backend (Railway)
      ↓
Backend → Supabase (завантажує vertex_analysis з facebook_ads)
      ↓
Backend збирає всі AI-аналізи в один контекст
      ↓
Backend → Claude AI (аналіз трендів)
      ↓
Backend отримує trend analysis
      ↓
Backend → Claude AI (генерація Kling промптів)
      ↓
Backend отримує промпти (Starting Frame, Final Frame, Kling Prompt)
      ↓
Frontend ← Тренди + Промпти
```

**Що робить Claude AI?**
- **Крок 1:** Аналізує тренди на основі Vertex AI інсайтів
- **Крок 2:** Генерує оптимізовані промпти для Kling AI (text-to-video)
- Враховує стиль, композицію, тренди конкурентів

---

## 💰 Орієнтовна вартість

| Сервіс | Вартість | Примітка |
|--------|----------|----------|
| **Vercel** | $0 | Free tier (Hobby) |
| **Railway** | ~$5/міс | $5 starter credit щомісяця |
| **Supabase** | $0 | До 500MB + 50,000 monthly active users |
| **Apify** | $49+/міс | Platform subscription + usage |
| **Vertex AI** | ~$0.002/1K chars | Pay-as-you-go (Gemini 2.0 Flash) |
| **Claude AI** | ~$3/1M input tokens | Pay-as-you-go (Sonnet 4) |

**Загальна орієнтовна вартість:** $54-100/міс (залежить від обсягу використання)

---

## 📞 Підтримка

Якщо виникли проблеми:

1. Перевірте [README.md](./README.md) - детальна документація
2. Перегляньте логи в Railway Dashboard
3. Перевірте Supabase SQL Editor на помилки
4. Створіть Issue на GitHub

---

**Успішного деплою! 🚀**
