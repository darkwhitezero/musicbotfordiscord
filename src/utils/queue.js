const { createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const path = require('path');

class GuildQueue {
  constructor(guildId) {
    this.guildId = guildId;
    this.items = [];
    this.current = null;
    this.connection = null;
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
      return;
    }
    this.current = this.items.shift();
    const resource = createAudioResource(this.current.filePath);
    this.player.play(resource);
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
    this.player.stop();
  }

  skip() {
    this.player.stop();
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
