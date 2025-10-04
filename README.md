# Createnko - Guru Trend

Сучасний веб-додаток для генерації та натхнення з інтеграцією Claude Sonnet 4 API, створений з React, TypeScript та Tailwind CSS.

## Функціональність

- **Generation**: Форма для генерації з полями App Link, Prompt та завантаженням файлів
- **Claude AI Integration**: Інтеграція з Claude Sonnet 4 API для генерації рекомендацій
- **Inspiration**: Сторінка з натхненням та трендами
- **Сучасний UI**: Адаптивний дизайн з використанням Tailwind CSS
- **Завантаження файлів**: Drag & drop функціональність для файлів

## Технології

- React 18
- TypeScript
- Tailwind CSS
- React Router
- Lucide React (іконки)
- Vite (збірщик)
- Claude Sonnet 4 API (Anthropic)

## Локальний запуск

1. Встановіть залежності:
```bash
npm install
```

2. Запустіть сервер розробки:
```bash
npm run dev
```

3. Відкрийте [http://localhost:5174](http://localhost:5174) у браузері

## Деплой на Vercel

1. Пуште код на GitHub
2. Підключіть репозиторій до Vercel
3. Vercel автоматично задеплоїть додаток

## Налаштування API

API ключ Claude вже налаштований для MVP версії. Для продакшн версії рекомендується використовувати змінні середовища.

## Структура проекту

```
src/
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Layout.tsx
│   └── FileUpload.tsx
├── pages/
│   ├── Generation.tsx
│   └── Inspiration.tsx
├── App.tsx
├── main.tsx
└── index.css
```
