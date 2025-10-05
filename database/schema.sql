-- GuruTrend Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ТАБЛИЦЯ: apify_requests
-- Зберігає історію запитів до Apify
-- ===========================================
CREATE TABLE IF NOT EXISTS apify_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id TEXT NOT NULL,
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_ads_scraped INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed'
);

-- ===========================================
-- ТАБЛИЦЯ: facebook_ads
-- Зберігає креативи з Facebook Ads Library
-- ===========================================
CREATE TABLE IF NOT EXISTS facebook_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apify_request_id UUID REFERENCES apify_requests(id) ON DELETE CASCADE,
  ad_archive_id TEXT UNIQUE NOT NULL,
  page_name TEXT,                        -- Page ID (наприклад, "161970940341938")
  title TEXT,                            -- Заголовок креативу
  caption TEXT,                          -- Опис креативу
  media_url TEXT,                        -- URL медіафайлу (image/video)
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  ad_link TEXT,                          -- Рекламне посилання
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  vertex_analysis TEXT,                  -- Результат AI-аналізу від Vertex AI
  vertex_analyzed_at TIMESTAMP           -- Коли був проведений аналіз
);

-- ===========================================
-- ТАБЛИЦЯ: system_prompts
-- Зберігає системні промпти для AI
-- ===========================================
CREATE TABLE IF NOT EXISTS system_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,              -- Унікальний ключ (TREND_ANALYSIS_PROMPT, KLING_OPTIMIZER_PROMPT)
  name TEXT NOT NULL,                    -- Назва промпту
  description TEXT,                      -- Опис призначення промпту
  prompt TEXT NOT NULL,                  -- Текст промпту
  category TEXT DEFAULT 'general',       -- Категорія промпту
  is_active BOOLEAN DEFAULT true,        -- Чи активний промпт
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- ІНДЕКСИ для швидкого пошуку
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_facebook_ads_page_name 
  ON facebook_ads(page_name);

CREATE INDEX IF NOT EXISTS idx_facebook_ads_ad_archive_id 
  ON facebook_ads(ad_archive_id);

CREATE INDEX IF NOT EXISTS idx_facebook_ads_vertex_analysis 
  ON facebook_ads(vertex_analysis) 
  WHERE vertex_analysis IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_facebook_ads_created_at 
  ON facebook_ads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_prompts_key 
  ON system_prompts(key);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================
ALTER TABLE apify_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

-- Policies для service role (повний доступ)
CREATE POLICY "Enable all access for service role" 
  ON apify_requests FOR ALL 
  USING (true);

CREATE POLICY "Enable all access for service role" 
  ON facebook_ads FOR ALL 
  USING (true);

CREATE POLICY "Enable all access for service role" 
  ON system_prompts FOR ALL 
  USING (true);

-- ===========================================
-- ФУНКЦІЯ: Автоматичне оновлення updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригер для system_prompts
CREATE TRIGGER update_system_prompts_updated_at
    BEFORE UPDATE ON system_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- КОМЕНТАРІ до таблиць
-- ===========================================
COMMENT ON TABLE apify_requests IS 'Історія запитів до Apify для парсингу Facebook Ads';
COMMENT ON TABLE facebook_ads IS 'Креативи з Facebook Ads Library з AI-аналізами';
COMMENT ON TABLE system_prompts IS 'Системні промпти для Claude AI та інших моделей';

COMMENT ON COLUMN facebook_ads.ad_archive_id IS 'Унікальний ID креативу з Facebook Ads Library';
COMMENT ON COLUMN facebook_ads.page_name IS 'Page ID сторінки (наприклад, 161970940341938)';
COMMENT ON COLUMN facebook_ads.vertex_analysis IS 'AI-аналіз креативу від Google Vertex AI (Gemini 2.0 Flash)';
COMMENT ON COLUMN system_prompts.key IS 'Унікальний ключ промпту (використовується в коді)';
