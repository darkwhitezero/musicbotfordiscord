require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
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
