# musicbotfordiscord

Discord-бот с поддержкой слэш-команд, воспроизведением музыки из Spotify и автоочисткой кэша.

## Возможности
- Слэш-команды: `/play`, `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/nowplaying`, `/join`, `/volume`, `/seek`
- Поиск треков в Spotify по ссылке или названию
- Воспроизведение превью аудио из Spotify (без YouTube/yt-dlp)
- Регулировка громкости и перемотка треков
- **Автовыход из канала** — бот выходит через 30 сек, если остался один
- Автоочистка кэша: удаление файлов старше 24 часов

---

## Требования

### Минимум
- Node.js 18+
- FFmpeg (или пакет `ffmpeg-static` — уже в зависимостях)

### Для Spotify
- `SPOTIFY_CLIENT_ID` и `SPOTIFY_CLIENT_SECRET` (обязательны)

### Для Discord Voice
- Одна из libsodium-библиотек: **`libsodium-wrappers`** (самый простой вариант) или `sodium`
- (опционально, но желательно) `@discordjs/opus` для лучшего качества/производительности

---

## Установка

```bash
npm install
```

Создайте файл `.env` (см. `.env.example`):
```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_app_client_id
DISCORD_GUILD_ID=your_test_guild_id

# Spotify (обязательно)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

Права на секреты:
```bash
chmod 600 .env
```

---

## Команды

| Команда | Описание |
|---------|----------|
| `/play <query>` | Проиграть трек (Spotify URL или поиск в Spotify) |
| `/pause` | Поставить на паузу |
| `/resume` | Продолжить воспроизведение |
| `/skip` | Пропустить текущий трек |
| `/stop` | Остановить и очистить очередь |
| `/queue` | Показать очередь |
| `/nowplaying` | Показать текущий трек |
| `/join` | Подключить бота к вашему каналу |
| `/volume <0-100>` | Установить громкость |
| `/seek <seconds>` | Перемотать на указанную секунду |

---

## Spotify

При использовании `/play`:
- Если передана ссылка `https://open.spotify.com/track/...`, бот берёт этот трек
- Если передано текстовое название, бот ищет первый результат в Spotify
- Для воспроизведения используется `preview_url` из Spotify API

> Важно: Spotify API обычно даёт только 30-секундное превью и не для всех треков.
> Если у трека нет `preview_url`, бот сообщит об ошибке и попросит выбрать другой трек.

### Настройка Spotify API

1. Создайте приложение на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Скопируйте Client ID и Client Secret
3. Добавьте в `.env`:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

---

## Автовыход из канала

Бот автоматически выходит из голосового канала, если:
- Все пользователи покинули канал (боты не считаются)
- Прошло 30 секунд ожидания

Это экономит ресурсы и не оставляет бота висеть в пустых каналах.

---

## Регистрация слэш-команд
```bash
npm run deploy-commands
```

## Запуск
```bash
npm start
```

---
