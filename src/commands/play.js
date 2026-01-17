const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const path = require('node:path');
const { fetchMetadata, downloadAudio } = require('../utils/youtube');

const CACHE_DIR = path.join(process.cwd(), 'cache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Найти и проиграть трек с YouTube')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Название трека или ссылка на YouTube')
        .setRequired(true)
    ),
  async execute(interaction, { queueManager }) {
    const query = interaction.options.getString('query', true);
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      await interaction.reply({ content: 'Сначала подключитесь к голосовому каналу.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const metadata = await fetchMetadata(query);
      const url = metadata.webpage_url || metadata.url || query;
      const filePath = await downloadAudio({ url, cacheDir: CACHE_DIR });
      const queue = queueManager.get(interaction.guildId);

      let connection = getVoiceConnection(interaction.guildId);
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator
        });
        queue.setConnection(connection);
      }

      queue.enqueue({
        title: metadata.title || 'Без названия',
        url,
        filePath
      });

      const position = queue.items.length + (queue.current ? 0 : 1);
      await interaction.editReply(`Добавлено в очередь: **${metadata.title || 'Без названия'}** (позиция ${position}).`);
    } catch (error) {
      console.error(error);
      await interaction.editReply('Не удалось загрузить трек. Убедитесь, что yt-dlp установлен и ссылка корректна.');
    }
  }
};
