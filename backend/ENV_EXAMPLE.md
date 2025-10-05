# Backend Environment Variables Example

Створіть файл `/backend/.env` з наступним вмістом:

```env
# ===========================================
# GuruTrend Backend Environment Variables
# ===========================================

# Claude API (Anthropic)
# Отримати: https://console.anthropic.com/
# Формат: sk-ant-api03-...
CLAUDE_API_KEY=sk-ant-api03-your-key-here

# Apify API Token
# Отримати: https://console.apify.com/account/integrations
# Формат: apify_api_...
APIFY_API_TOKEN=apify_api_your_token_here

# Supabase
# Отримати: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
# ВАЖЛИВО: Використовуйте service_role key (secret), НЕ anon key!
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Vertex AI
# Інструкція по налаштуванню: https://cloud.google.com/vertex-ai/docs/start/client-libraries
# 1. Створіть Service Account у Google Cloud Console
# 2. Додайте ролі: "Vertex AI User" та "Storage Admin"
# 3. Створіть JSON ключ
# 4. Скопіюйте весь JSON як одну строку

VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_CREDENTIALS={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

# Optional: Gemini API (fallback якщо Vertex AI не налаштовано)
# Отримати: https://makersuite.google.com/app/apikey
# GEMINI_API_KEY=AIza...

# Server Configuration (опціонально)
PORT=3000
NODE_ENV=production
```

## Як отримати кожен ключ

### 1. Claude API Key

1. Зареєструйтесь на [Anthropic Console](https://console.anthropic.com/)
2. Перейдіть до розділу "API Keys"
3. Створіть новий ключ
4. Скопіюйте (формат: `sk-ant-api03-...`)

### 2. Apify API Token

1. Зареєструйтесь на [Apify](https://apify.com/)
2. Перейдіть до [Integrations](https://console.apify.com/account/integrations)
3. Скопіюйте "Personal API Token"

### 3. Supabase Credentials

1. Створіть проект на [Supabase](https://supabase.com/)
2. Перейдіть до **Settings** → **API**
3. Скопіюйте:
   - `URL` (Project URL)
   - `service_role` key (**НЕ anon key!**)

### 4. Google Vertex AI Credentials

1. Створіть проект на [Google Cloud Console](https://console.cloud.google.com/)
2. Увімкніть API:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable storage.googleapis.com
   ```
3. Створіть Service Account:
   - **IAM & Admin** → **Service Accounts** → **Create Service Account**
   - Додайте ролі:
     - `Vertex AI User`
     - `Storage Admin`
4. Створіть JSON ключ:
   - Клікніть на Service Account → **Keys** → **Add Key** → **JSON**
5. Відкрийте JSON файл та скопіюйте весь вміст як одну строку для `VERTEX_AI_CREDENTIALS`

## Перевірка

Після створення `.env` файлу, запустіть backend:

```bash
cd backend
npm start
```

Ви побачите діагностику:

```
=== API KEYS DIAGNOSTICS ===
CLAUDE_API_KEY exists: true ✅
APIFY_API_TOKEN exists: true ✅
SUPABASE_URL exists: true ✅
VERTEX_AI_CREDENTIALS exists: true ✅
```

Якщо щось `false` - перевірте `.env` файл.
