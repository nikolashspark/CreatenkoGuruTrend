/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLAUDE_API_KEY: string
  // додайте інші змінні середовища тут
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
