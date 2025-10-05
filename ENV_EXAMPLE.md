# Frontend Environment Variables Example

Створіть файл `/.env` (в корені проекту) з наступним вмістом:

```env
# ===========================================
# GuruTrend Frontend Environment Variables
# ===========================================

# Railway Backend API URL
# Для локальної розробки: http://localhost:3000
# Для продакшн: https://your-backend.up.railway.app
VITE_RAILWAY_API_URL=http://localhost:3000
```

## Налаштування для різних середовищ

### Локальна розробка

```env
VITE_RAILWAY_API_URL=http://localhost:3000
```

Переконайтесь що backend запущено локально на порті 3000.

### Продакшн (Railway/Vercel)

```env
VITE_RAILWAY_API_URL=https://your-backend-name.up.railway.app
```

Замініть `your-backend-name` на фактичну адресу вашого backend на Railway.

## Перевірка

Після створення `.env` файлу, запустіть frontend:

```bash
npm run dev
```

Відкрийте консоль браузера та перевірте що запити йдуть на правильну адресу:

```
http://localhost:3000/api/facebook-ads  (локально)
або
https://your-backend.up.railway.app/api/facebook-ads  (продакшн)
```

## Важливо!

- Файли `.env` **НЕ** комітяться в Git (додані в `.gitignore`)
- Для Railway/Vercel додайте змінні через їхній UI
- Перезапустіть dev server після зміни `.env` файлів
