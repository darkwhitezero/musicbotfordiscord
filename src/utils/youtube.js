const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');

async function ensureCacheDir(cacheDir) {
  await fs.mkdir(cacheDir, { recursive: true });
}

// Можно задать в .env: YTDLP_BIN=/usr/local/bin/yt-dlp
const YTDLP_BIN = process.env.YTDLP_BIN || 'yt-dlp';

// SABR/403 фикс: не использовать web-клиент
const YT_EXTRACTOR_ARGS = 'youtube:player_client=tv,android';

// cookies для антибота
const YTDLP_COOKIES = process.env.YTDLP_COOKIES;

function withCommonArgs(args) {
  const out = [...args];

  // cookies (если есть)
  if (YTDLP_COOKIES) {
    out.unshift('--cookies', YTDLP_COOKIES);
  }

  // SABR workaround
  out.unshift('--extractor-args', YT_EXTRACTOR_ARGS);

  // на всякий (не обязательно, но помогает стабильности)
  out.unshift('--no-playlist');

  return out;
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const finalArgs = withCommonArgs(args);

    const process = spawn(YTDLP_BIN, finalArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => (stdout += data.toString()));
    process.stderr.on('data', (data) => (stderr += data.toString()));

    process.on('error', reject);

    process.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `yt-dlp exited with code ${code}`));
    });
  });
}

async function fetchMetadata(query) {
  const q = query.startsWith('http') ? query : `ytsearch1:${query}`;

  const args = [
    '-J',
    '--no-playlist',
    '--extractor-args', 'youtube:player_client=tv,android',
    q
  ];

  const cookiesPath = process.env.YTDLP_COOKIES;
  if (cookiesPath) {
    args.unshift('--cookies', cookiesPath);
  }

  const { stdout } = await runYtDlp(args);
  const metadata = JSON.parse(stdout);

  if (metadata.entries && metadata.entries.length > 0) {
    return metadata.entries[0];
  }
  return metadata;
}

async function downloadAudio({ url, cacheDir }) {
  await ensureCacheDir(cacheDir);
  const fileId = randomUUID();
  const outputTemplate = path.join(cacheDir, `${fileId}.%(ext)s`);

  const args = ['-f', 'bestaudio', '-o', outputTemplate, url];
  const cookiesPath = process.env.YTDLP_COOKIES;
  if (cookiesPath) {
    args.unshift('--cookies', cookiesPath);
  }
  await runYtDlp(args);

  const files = await fs.readdir(cacheDir);
  const match = files.find((file) => file.startsWith(fileId));
  if (!match) throw new Error('Downloaded file not found');
  return path.join(cacheDir, match);
}

module.exports = { fetchMetadata, downloadAudio };

