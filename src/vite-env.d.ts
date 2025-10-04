/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLAUDE_API_KEY: string;
  readonly VITE_RAILWAY_API_URL: string;
  readonly VITE_APIFY_API_TOKEN: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}