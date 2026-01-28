/**
 * Spotify URL handling module
 * Supports fetching track metadata via Spotify Web API or oEmbed fallback
 */

const SPOTIFY_TRACK_REGEX = /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/;

// Token cache
let accessToken = null;
let tokenExpiresAt = 0;

/**
 * Check if query is a Spotify URL
 */
function isSpotifyUrl(query) {
    return SPOTIFY_TRACK_REGEX.test(query);
}

/**
 * Extract track ID from Spotify URL
 */
function parseSpotifyTrackId(url) {
    const match = url.match(SPOTIFY_TRACK_REGEX);
    return match ? match[1] : null;
}

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getAccessToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return null;
    }

    // Return cached token if still valid
    if (accessToken && Date.now() < tokenExpiresAt - 60000) {
        return accessToken;
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        console.error('Spotify auth failed:', response.status);
        return null;
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000);

    return accessToken;
}

/**
 * Fetch track info from Spotify Web API
 */
async function fetchFromSpotifyApi(trackId) {
    const token = await getAccessToken();
    if (!token) return null;

    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        console.error('Spotify API error:', response.status);
        return null;
    }

    const track = await response.json();

    return {
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        duration: Math.floor(track.duration_ms / 1000),
        thumbnail: track.album.images[0]?.url || null,
        searchQuery: `${track.artists[0]?.name || ''} - ${track.name}`
    };
}

/**
 * Fetch track info from Spotify oEmbed (fallback, no auth required)
 */
async function fetchFromOembed(url) {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;

    const response = await fetch(oembedUrl);

    if (!response.ok) {
        console.error('Spotify oEmbed error:', response.status);
        return null;
    }

    const data = await response.json();

    // oEmbed title format: "Song Name - song and target by Artist on Spotify"
    // We need to parse it
    const title = data.title || '';

    // Try to extract just the song name (before " - song")
    let songName = title;
    let artist = '';

    // Common patterns: "Song - song and lyrics by Artist on Spotify"
    // or just "Song by Artist"
    const byMatch = title.match(/^(.+?)\s+(?:-\s+song.*?)?by\s+(.+?)(?:\s+on\s+Spotify)?$/i);
    if (byMatch) {
        songName = byMatch[1].replace(/\s*-\s*song.*$/i, '').trim();
        artist = byMatch[2].trim();
    }

    return {
        title: songName,
        artist: artist,
        duration: null, // oEmbed doesn't provide duration
        thumbnail: data.thumbnail_url || null,
        searchQuery: artist ? `${artist} - ${songName}` : songName
    };
}

/**
 * Get Spotify track info - tries API first, falls back to oEmbed
 */
async function getSpotifyTrackInfo(url) {
    const trackId = parseSpotifyTrackId(url);
    if (!trackId) {
        throw new Error('Invalid Spotify track URL');
    }

    // Try Spotify API first
    const apiResult = await fetchFromSpotifyApi(trackId);
    if (apiResult) {
        return apiResult;
    }

    // Fallback to oEmbed
    const oembedResult = await fetchFromOembed(url);
    if (oembedResult) {
        return oembedResult;
    }

    throw new Error('Could not fetch Spotify track info');
}

/**
 * Format duration in seconds to mm:ss
 */
function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
    isSpotifyUrl,
    parseSpotifyTrackId,
    getSpotifyTrackInfo,
    formatDuration
};
