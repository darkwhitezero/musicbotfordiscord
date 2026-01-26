# musicbotfordiscord

Discord-бот с поддержкой слэш-команд, загрузкой аудио с YouTube и автоочисткой кэша.

## Возможности
- Слэш-команды: `/play`, `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/nowplaying`
- Поиск и скачивание треков с YouTube через `yt-dlp`
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

Создайте файл `.env`:
```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_app_client_id
DISCORD_GUILD_ID=your_test_guild_id

# yt-dlp
YTDLP_BIN=/usr/local/bin/yt-dlp
YTDLP_COOKIES=/root/musicbotfordiscord/cookies.txt
```

Права на секреты:
```bash
chmod 600 .env cookies.txt
```

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
- `Sign in to confirm you’re not a bot`
- `HTTP Error 403: Forbidden`

экспортируйте cookies из браузера (расширение “Get cookies.txt” / любое другое) в Netscape формате и сохраните, например:
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
- Если YouTube начинает отдавать “SABR streaming / 403”, обычно помогает использовать не web-клиент (в коде рекомендуется/используется `player_client=tv,android`).

## Лицензия
См. файл `LICENSE`.
