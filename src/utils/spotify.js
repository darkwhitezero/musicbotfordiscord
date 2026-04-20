/**
 * Spotify module
 * - Resolves Spotify tracks from URL or text query
 * - Downloads Spotify preview audio (preview_url) to local cache
 */

const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');

const SPOTIFY_TRACK_REGEX = /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/;

let accessToken = null;
let tokenExpiresAt = 0;

function isSpotifyUrl(query) {
  return SPOTIFY_TRACK_REGEX.test(query);
}

function parseSpotifyTrackId(url) {
  const match = url.match(SPOTIFY_TRACK_REGEX);
  return match ? match[1] : null;
}

async function ensureCacheDir(cacheDir) {
  await fs.mkdir(cacheDir, { recursive: true });
}

async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Для Spotify API нужны SPOTIFY_CLIENT_ID и SPOTIFY_CLIENT_SECRET в .env');
  }

  if (accessToken && Date.now() < tokenExpiresAt - 60000) {
    return accessToken;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return accessToken;
}

async function fetchTrackById(trackId) {
  const token = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Spotify track fetch failed: ${response.status}`);
  }

  const track = await response.json();
  return mapTrack(track);
}

async function searchTrack(query) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify search failed: ${response.status}`);
  }

  const data = await response.json();
  const track = data?.tracks?.items?.[0];
  if (!track) {
    throw new Error('Трек не найден в Spotify');
  }

  return mapTrack(track);
}

function mapTrack(track) {
  return {
    title: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    duration: Math.floor(track.duration_ms / 1000),
    thumbnail: track.album?.images?.[0]?.url || null,
    url: track.external_urls?.spotify || null,
    previewUrl: track.preview_url || null
  };
}

async function resolveSpotifyTrack(query) {
  if (isSpotifyUrl(query)) {
    const trackId = parseSpotifyTrackId(query);
    if (!trackId) {
      throw new Error('Некорректная Spotify ссылка');
    }
    return fetchTrackById(trackId);
  }

  return searchTrack(query);
}

async function downloadSpotifyPreview({ previewUrl, cacheDir }) {
  if (!previewUrl) {
    throw new Error('У трека нет preview_url в Spotify API. Попробуйте другой трек.');
  }

  await ensureCacheDir(cacheDir);

  const response = await fetch(previewUrl);
  if (!response.ok) {
    throw new Error(`Spotify preview download failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filePath = path.join(cacheDir, `${randomUUID()}.mp3`);
  await fs.writeFile(filePath, buffer);

  return filePath;
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
  isSpotifyUrl,
  parseSpotifyTrackId,
  resolveSpotifyTrack,
  downloadSpotifyPreview,
  formatDuration
};
