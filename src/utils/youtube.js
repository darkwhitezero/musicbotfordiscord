const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');

async function ensureCacheDir(cacheDir) {
  await fs.mkdir(cacheDir, { recursive: true });
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const process = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('error', (error) => {
      reject(error);
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      }
    });
  });
}

async function fetchMetadata(query) {
  const args = ['-J', '--no-playlist', query.startsWith('http') ? query : `ytsearch1:${query}`];
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
  await runYtDlp(args);

  const files = await fs.readdir(cacheDir);
  const match = files.find((file) => file.startsWith(fileId));
  if (!match) {
    throw new Error('Downloaded file not found');
  }
  return path.join(cacheDir, match);
}

module.exports = {
  fetchMetadata,
  downloadAudio
};
