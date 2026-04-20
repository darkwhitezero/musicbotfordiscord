const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const path = require('node:path');
const {
  resolveSpotifyTrack,
  downloadSpotifyPreview,
  formatDuration
} = require('../utils/spotify');

const CACHE_DIR = path.join(process.cwd(), 'cache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Найти и проиграть трек из Spotify')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Название трека или ссылка Spotify')
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
      const track = await resolveSpotifyTrack(query);
      const filePath = await downloadSpotifyPreview({
        previewUrl: track.previewUrl,
        cacheDir: CACHE_DIR
      });

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
        title: track.title || 'Без названия',
        artist: track.artist || '',
        duration: track.duration || 0,
        thumbnail: track.thumbnail || null,
        url: track.url || null,
        filePath
      });

      const position = queue.items.length + (queue.current ? 0 : 1);

      const embed = new EmbedBuilder()
        .setColor(0x1DB954)
        .setTitle('🎵 Трек добавлен!')
        .setDescription(`**${track.title || 'Без названия'}**`)
        .setTimestamp();

      if (track.artist) {
        embed.addFields({ name: 'Исполнитель', value: track.artist, inline: true });
      }

      embed.addFields({
        name: 'Длительность',
        value: formatDuration(track.duration),
        inline: true
      });

      if (position > 1) {
        embed.addFields({ name: 'Позиция в очереди', value: `#${position}`, inline: true });
      }

      if (track.thumbnail) {
        embed.setThumbnail(track.thumbnail);
      }

      if (track.url) {
        embed.addFields({ name: 'Источник', value: `[Spotify](${track.url})`, inline: true });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        'Не удалось загрузить трек из Spotify. Убедитесь, что настроены SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET и у трека есть preview.'
      );
    }
  }
};
