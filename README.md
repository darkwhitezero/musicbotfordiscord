# musicbotfordiscord

Discord-бот с поддержкой слэш-команд, загрузкой аудио с YouTube/Spotify и автоочисткой кэша.

## Возможности
- Слэш-команды: `/play`, `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/nowplaying`, `/join`, `/volume`, `/seek`
- Поиск и скачивание треков с YouTube через `yt-dlp`
- **Поддержка Spotify-ссылок** — автоконвертация в YouTube-запрос
- Регулировка громкости и перемотка треков
- **Автовыход из канала** — бот выходит через 30 сек, если остался один
- Автоочистка кэша: удаление файлов старше 24 часов

---

## Требования

### Минимум
- Node.js 18+
- FFmpeg (или пакет `ffmpeg-static` — уже в зависимостях)
- `yt-dlp` (свежий, рекомендуется ставить НЕ через `apt`)

### Рекомендуется для стабильной работы YouTube
- Cookies-файл (Netscape формат), путь задаётся в `YTDLP_COOKIES`
- Deno (нужен как JS runtime для новых версий `yt-dlp` / YouTube extraction)

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

# yt-dlp
YTDLP_BIN=/usr/local/bin/yt-dlp
YTDLP_COOKIES=/root/musicbotfordiscord/cookies.txt

# Spotify (опционально)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

Права на секреты:
```bash
chmod 600 .env cookies.txt
```

---

## Команды

| Команда | Описание |
|---------|----------|
| `/play <query>` | Проиграть трек (YouTube URL, Spotify URL или поиск) |
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

При использовании Spotify-ссылок (`https://open.spotify.com/track/...`):
- Бот получает метаданные трека (исполнитель, название)
- Ищет эквивалент на YouTube и воспроизводит его
- Spotify не воспроизводится напрямую (DRM)

### Настройка Spotify API (рекомендуется)

1. Создайте приложение на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Скопируйте Client ID и Client Secret
3. Добавьте в `.env`:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

**Без API-ключей** бот использует oEmbed (работает, но без точной длительности трека).

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

## Cookies для YouTube (важно)

Если видите ошибки вида:
- `Sign in to confirm you're not a bot`
- `HTTP Error 403: Forbidden`

экспортируйте cookies из браузера (расширение "Get cookies.txt" / любое другое) в Netscape формате и сохраните, например:
- `/root/musicbotfordiscord/cookies.txt`

Проверка вручную:
```bash
yt-dlp --cookies /root/musicbotfordiscord/cookies.txt -f ba "https://www.youtube.com/watch?v=VIDEO_ID"
```

---

## Запуск на Linux

> Этот план соответствует варианту, когда проект лежит в `/root/musicbotfordiscord` и сервис запускается от `root`.

### 1) Обновите систему и установите зависимости
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git curl ffmpeg unzip
```

### 2) Установите Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

### 3) Установите свежий yt-dlp (рекомендуется вместо apt-версии)
```bash
sudo apt-get remove -y yt-dlp || true

sudo wget -O /usr/local/bin/yt-dlp   https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

yt-dlp --version
```

### 4) Установите Deno (JS runtime для yt-dlp / YouTube extraction)
```bash
curl -fsSL https://deno.land/install.sh | sh
sudo ln -sf /root/.deno/bin/deno /usr/local/bin/deno
deno --version
```

### 5) Клонируйте проект и установите зависимости
```bash
git clone <your_repo_url>
cd musicbotfordiscord
npm install
```

### 6) Поставьте libsodium для Discord Voice (обязательно)
```bash
npm i libsodium-wrappers
```

(Опционально, но желательно)
```bash
npm i @discordjs/opus
```

### 7) Создайте файл конфигурации `.env` и добавьте cookies
```bash
nano .env
```

Пример `.env`:
```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_app_client_id
DISCORD_GUILD_ID=your_test_guild_id
YTDLP_BIN=/usr/local/bin/yt-dlp
YTDLP_COOKIES=/root/musicbotfordiscord/cookies.txt
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

Положите cookies:
- `/root/musicbotfordiscord/cookies.txt`

Права:
```bash
chmod 600 .env cookies.txt
```

### 8) Зарегистрируйте слэш-команды
```bash
npm run deploy-commands
```

### 9) Проверьте локальный запуск
```bash
npm start
```
Если бот запустился и отвечает в Discord — переходите к запуску как сервис.

---

## Автозапуск через systemd (под root, проект в /root)

Создайте unit-файл `/etc/systemd/system/discord-music-bot.service`:
```ini
[Unit]
Description=Discord Music Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/musicbotfordiscord
EnvironmentFile=/root/musicbotfordiscord/.env
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node /root/musicbotfordiscord/src/index.js
Restart=on-failure
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Запустите и включите сервис:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now discord-music-bot
sudo systemctl status discord-music-bot --no-pager
```

Логи:
```bash
journalctl -u discord-music-bot -f
```

---

## Заметки

- `yt-dlp` должен быть доступен в PATH. Для systemd мы добавляем `/usr/local/bin` в `PATH` в unit-файле.
- Кэш хранится в папке `cache/` и автоматически очищается раз в час (удаляются файлы старше 24 часов).
- Если YouTube начинает отдавать "SABR streaming / 403", обычно помогает использовать не web-клиент (в коде рекомендуется/используется `player_client=tv,android`).

## Лицензия
См. файл `LICENSE`.
