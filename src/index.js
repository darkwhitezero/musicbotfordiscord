require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const ffmpegPath = require('ffmpeg-static');
const { QueueManager } = require('./utils/queue');
const { cleanupCache } = require('./utils/cleanup');

if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

const queueManager = new QueueManager();
const CACHE_DIR = path.join(process.cwd(), 'cache');

// Auto-leave timers per guild (debounce)
const autoLeaveTimers = new Map();
const AUTO_LEAVE_DELAY = 30000; // 30 seconds

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);

  setInterval(async () => {
    try {
      const activeFiles = queueManager.getActiveFiles();
      const removed = await cleanupCache(CACHE_DIR, activeFiles);
      if (removed.length) {
        console.log(`Cleanup removed ${removed.length} files.`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }, 60 * 60 * 1000);
});

// Auto-leave when bot is alone in voice channel
client.on('voiceStateUpdate', (oldState, newState) => {
  // Only care about users leaving (not joining)
  if (!oldState.channel) return;

  const guildId = oldState.guild.id;
  const connection = getVoiceConnection(guildId);
  if (!connection) return;

  const botChannelId = connection.joinConfig.channelId;
  const channel = oldState.channel.id === botChannelId ? oldState.channel : null;

  // If user left from bot's channel
  if (!channel) return;

  // Count non-bot members in the channel
  const nonBotMembers = channel.members.filter(member => !member.user.bot);

  if (nonBotMembers.size === 0) {
    // No users left, start auto-leave timer (with debounce)
    if (!autoLeaveTimers.has(guildId)) {
      const timer = setTimeout(() => {
        // Re-check if still alone
        const currentConnection = getVoiceConnection(guildId);
        if (!currentConnection) {
          autoLeaveTimers.delete(guildId);
          return;
        }

        const currentChannelId = currentConnection.joinConfig.channelId;
        const currentChannel = client.channels.cache.get(currentChannelId);

        if (currentChannel) {
          const stillAlone = currentChannel.members.filter(m => !m.user.bot).size === 0;
          if (stillAlone) {
            console.log(`Auto-leaving empty channel in guild ${guildId}`);
            const queue = queueManager.get(guildId);
            queue.stop();
            currentConnection.destroy();
          }
        }

        autoLeaveTimers.delete(guildId);
      }, AUTO_LEAVE_DELAY);

      autoLeaveTimers.set(guildId, timer);
    }
  } else {
    // Someone is still there, cancel timer if exists
    const existingTimer = autoLeaveTimers.get(guildId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      autoLeaveTimers.delete(guildId);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return;
  }

  try {
    await command.execute(interaction, { queueManager });
  } catch (error) {
    console.error(error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('Произошла ошибка при выполнении команды.');
    } else {
      await interaction.reply({ content: 'Произошла ошибка при выполнении команды.', ephemeral: true });
    }
  }
});

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN is required in .env');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
