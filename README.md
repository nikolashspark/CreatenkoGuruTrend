# Createnko - Guru Trend

Сучасний веб-додаток для генерації та натхнення, створений з React, TypeScript та Tailwind CSS.

## Функціональність

- **Generation**: Форма для генерації з полями App Link, Prompt та завантаженням файлів
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

## Локальний запуск

1. Встановіть залежності:
```bash
npm install
```

2. Запустіть сервер розробки:
```bash
npm run dev
```

3. Відкрийте [http://localhost:5173](http://localhost:5173) у браузері

## Деплой на Vercel

1. Пуште код на GitHub
2. Підключіть репозиторій до Vercel
3. Vercel автоматично виявить налаштування Vite та задеплоїть додаток

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
