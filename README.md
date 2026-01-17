# musicbotfordiscord

Discord-бот с поддержкой слэш-команд, загрузкой аудио с YouTube и автоочисткой кэша.

## Возможности
- Слэш-команды `/play`, `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/nowplaying`.
- Поиск и скачивание треков с YouTube через `yt-dlp`.
- Автоочистка кэша: удаление файлов старше 24 часов.

## Требования
- Node.js 18+
- Установленный `yt-dlp` в PATH
- FFmpeg (для декодирования) или пакет `ffmpeg-static` (уже в зависимостях)

## Установка
```bash
npm install
```

Создайте файл `.env`:
```bash
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_app_client_id
DISCORD_GUILD_ID=your_test_guild_id
```

## Регистрация слэш-команд
```bash
npm run deploy-commands
```

## Запуск
```bash
npm start
```

## Запуск на VPS (Beget)
### Рекомендуемая конфигурация
Для комфортного воспроизведения музыки 24/7 достаточно:
- 1 vCPU
- 1–2 ГБ RAM
- 10–20 ГБ SSD

Если планируется несколько серверов/параллельных очередей, берите 2 vCPU и 2–4 ГБ RAM.

### Подготовка сервера
1. Установите Node.js 18+ и `yt-dlp`:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs yt-dlp ffmpeg
```

2. Склонируйте репозиторий и установите зависимости:
```bash
git clone <your_repo_url>
cd musicbotfordiscord
npm install
```

3. Создайте `.env` и заполните токены:
```bash
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_app_client_id
DISCORD_GUILD_ID=your_test_guild_id
```

4. Зарегистрируйте слэш-команды:
```bash
npm run deploy-commands
```

### Запуск как сервис (systemd)
Создайте unit-файл `/etc/systemd/system/discord-music-bot.service`:
```ini
[Unit]
Description=Discord Music Bot
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/musicbotfordiscord
EnvironmentFile=/path/to/musicbotfordiscord/.env
ExecStart=/usr/bin/node /path/to/musicbotfordiscord/src/index.js
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

Запустите сервис:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now discord-music-bot
sudo systemctl status discord-music-bot
```

## Заметки
- `yt-dlp` используется для скачивания аудио. Убедитесь, что бинарник доступен в PATH.
- Кэш хранится в папке `cache/` и автоматически очищается раз в час.
