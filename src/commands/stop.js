const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Остановить воспроизведение и очистить очередь'),
  async execute(interaction, { queueManager }) {
    const queue = queueManager.get(interaction.guildId);
    queue.stop();
    await interaction.reply('Воспроизведение остановлено, очередь очищена.');
  }
};
