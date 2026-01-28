const { createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const path = require('path');

class GuildQueue {
  constructor(guildId) {
    this.guildId = guildId;
    this.items = [];
    this.current = null;
    this.connection = null;
    this.volume = 100;
    this.currentResource = null;
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause
      }
    });
    this.player.on(AudioPlayerStatus.Idle, () => {
      this.playNext();
    });
    this.player.on('error', (error) => {
      console.error(`Audio player error (guild ${this.guildId}):`, error);
      this.playNext();
    });
  }

  setConnection(connection) {
    this.connection = connection;
    this.connection.subscribe(this.player);
  }

  enqueue(item) {
    this.items.push(item);
    if (!this.current) {
      this.playNext();
    }
  }

  playNext() {
    if (this.items.length === 0) {
      this.current = null;
      this.currentResource = null;
      return;
    }
    this.current = this.items.shift();
    this._playCurrentFrom(0);
  }

  /**
   * Play current track from a specific offset (in seconds)
   */
  _playCurrentFrom(offsetSeconds = 0) {
    if (!this.current) return;

    const resourceOptions = {
      inlineVolume: true
    };

    // Add ffmpeg args for seeking if offset > 0
    if (offsetSeconds > 0) {
      resourceOptions.inputType = undefined; // Let it auto-detect
      // Use ffmpeg to seek: create resource with ffmpeg args
      const ffmpegArgs = [
        '-ss', offsetSeconds.toString(),
        '-i', this.current.filePath,
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1'
      ];

      const { spawn } = require('node:child_process');
      const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
      const ffmpeg = spawn(ffmpegPath, ffmpegArgs, {
        stdio: ['ignore', 'pipe', 'ignore']
      });

      const resource = createAudioResource(ffmpeg.stdout, {
        inlineVolume: true,
        inputType: 2 // Raw (s16le)
      });

      resource.volume?.setVolume(this.volume / 100);
      this.currentResource = resource;
      this.player.play(resource);
    } else {
      // Normal playback from start
      const resource = createAudioResource(this.current.filePath, resourceOptions);
      resource.volume?.setVolume(this.volume / 100);
      this.currentResource = resource;
      this.player.play(resource);
    }
  }

  pause() {
    return this.player.pause();
  }

  resume() {
    return this.player.unpause();
  }

  stop() {
    this.items = [];
    this.current = null;
    this.currentResource = null;
    this.player.stop();
  }

  skip() {
    this.player.stop();
  }

  /**
   * Set volume (0-100)
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(100, value));
    if (this.currentResource?.volume) {
      this.currentResource.volume.setVolume(this.volume / 100);
    }
  }

  /**
   * Seek to specific second in current track
   */
  seekTo(seconds) {
    if (!this.current) return false;
    this._playCurrentFrom(seconds);
    return true;
  }

  getQueueSummary() {
    return this.items.map((item, index) => `${index + 1}. ${item.title}`).join('\n');
  }

  getNowPlaying() {
    return this.current;
  }

  getActiveFiles() {
    const files = [];
    if (this.current?.filePath) {
      files.push(path.resolve(this.current.filePath));
    }
    for (const item of this.items) {
      if (item.filePath) {
        files.push(path.resolve(item.filePath));
      }
    }
    return files;
  }
}

class QueueManager {
  constructor() {
    this.queues = new Map();
  }

  get(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, new GuildQueue(guildId));
    }
    return this.queues.get(guildId);
  }

  getActiveFiles() {
    const files = new Set();
    for (const queue of this.queues.values()) {
      for (const file of queue.getActiveFiles()) {
        files.add(file);
      }
    }
    return files;
  }
}

module.exports = {
  QueueManager
};
