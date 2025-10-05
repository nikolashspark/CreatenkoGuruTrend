# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned Features
- [ ] Export Kling prompts to file
- [ ] Analytics dashboard for analyzed ads
- [ ] Batch AI analysis for multiple creatives
- [ ] Integration with more AI models (Midjourney, DALL-E)

---

## [1.0.0] - 2025-01-15

### 🎉 Initial Release

#### Added
- **Competitor Analysis (Facebook Ads)**
  - Integration with Apify for Facebook Ads scraping
  - Automatic deduplication by `ad_archive_id`
  - Filter creatives without media
  - Save creatives to Supabase database
  
- **AI Analysis with Vertex AI**
  - Google Vertex AI Gemini 2.0 Flash integration
  - Multimodal analysis (images and videos)
  - Google Cloud Storage for temporary media storage
  - Automatic analysis mode for new creatives
  - Manual analysis with "Analyze" button
  - Cache AI results in database
  
- **Prompt Wizard**
  - 3 modes of operation:
    - Mode 1: User idea only (no trend analysis)
    - Mode 2: All trends from all Page IDs
    - Mode 3: Fixed Page ID trends
  - Claude AI for trend analysis
  - Kling AI prompt generation (Starting Frame, Final Frame, Kling Prompt)
  - Dropdown with analyzed Page IDs
  
- **Config UI**
  - Edit system prompts through UI
  - Store prompts in Supabase
  - Two main prompts: `TREND_ANALYSIS_PROMPT`, `KLING_OPTIMIZER_PROMPT`
  
- **Database (Supabase)**
  - `apify_requests` table for scraping history
  - `facebook_ads` table for creatives
  - `system_prompts` table for AI prompts
  - Row Level Security (RLS) enabled
  
- **Backend API**
  - `POST /api/apify/facebook-ads` - Scrape Facebook Ads
  - `GET /api/facebook-ads` - Fetch saved ads
  - `POST /api/facebook-ads/:id/analyze` - Analyze single ad
  - `POST /api/prompt-wizard/generate` - Generate Kling prompts
  - `GET /api/system-prompts` - Fetch system prompts
  - `PUT /api/system-prompts/:id` - Update prompt
  - `GET /api/analyzed-page-ids` - Get list of analyzed Page IDs
  
- **Frontend**
  - React 18 with TypeScript
  - TailwindCSS for styling
  - React Router for navigation
  - Responsive design

#### Technical Stack
- Frontend: React 18, TypeScript, Vite, TailwindCSS
- Backend: Node.js, Express 5, WebSocket
- Database: Supabase (PostgreSQL)
- AI Services: Google Vertex AI, Claude AI (Anthropic)
- External APIs: Apify
- Deployment: Railway (backend), Vercel (frontend, optional)

---

## Version History Format

```
## [Version] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security updates
```

---

[Unreleased]: https://github.com/yourusername/GuruTrend/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/GuruTrend/releases/tag/v1.0.0
