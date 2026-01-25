const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Показать очередь треков'),
  async execute(interaction, { queueManager }) {
    const queue = queueManager.get(interaction.guildId);
    const nowPlaying = queue.getNowPlaying();
    const upcoming = queue.getQueueSummary();

    let message = '';
    if (nowPlaying) {
      message += `Сейчас играет: **${nowPlaying.title}**\n`;
    }
    if (upcoming) {
      message += `Очередь:\n${upcoming}`;
    }

    if (!message) {
      message = 'Очередь пуста.';
    }

    await interaction.reply(message);
  }
};
