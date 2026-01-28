const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const path = require('node:path');
const { fetchMetadata, downloadAudio } = require('../utils/youtube');
const { isSpotifyUrl, getSpotifyTrackInfo, formatDuration } = require('../utils/spotify');

const CACHE_DIR = path.join(process.cwd(), 'cache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Найти и проиграть трек с YouTube или Spotify')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Название трека, ссылка YouTube или Spotify')
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
      let searchQuery = query;
      let spotifyInfo = null;

      // Handle Spotify URLs
      if (isSpotifyUrl(query)) {
        spotifyInfo = await getSpotifyTrackInfo(query);
        searchQuery = spotifyInfo.searchQuery;
      }

      // Fetch YouTube metadata and download
      const metadata = await fetchMetadata(searchQuery);
      const url = metadata.webpage_url || metadata.url || searchQuery;
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

      // Use Spotify info if available, otherwise YouTube metadata
      const trackTitle = spotifyInfo?.title || metadata.title || 'Без названия';
      const trackArtist = spotifyInfo?.artist || metadata.uploader || metadata.channel || '';
      const trackDuration = spotifyInfo?.duration || metadata.duration || 0;
      const trackThumbnail = spotifyInfo?.thumbnail || metadata.thumbnail || null;

      queue.enqueue({
        title: trackTitle,
        artist: trackArtist,
        duration: trackDuration,
        thumbnail: trackThumbnail,
        url,
        filePath
      });

      const position = queue.items.length + (queue.current ? 0 : 1);

      // Create embed
      const embed = new EmbedBuilder()
        .setColor(0x1DB954) // Spotify green
        .setTitle('🎵 Трек добавлен!')
        .setDescription(`**${trackTitle}**`)
        .setTimestamp();

      if (trackArtist) {
        embed.addFields({ name: 'Исполнитель', value: trackArtist, inline: true });
      }

      embed.addFields({
        name: 'Длительность',
        value: formatDuration(trackDuration),
        inline: true
      });

      if (position > 1) {
        embed.addFields({ name: 'Позиция в очереди', value: `#${position}`, inline: true });
      }

      if (trackThumbnail) {
        embed.setThumbnail(trackThumbnail);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply('Не удалось загрузить трек. Убедитесь, что yt-dlp установлен и ссылка корректна.');
    }
  }
};
