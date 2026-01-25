const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Поставить воспроизведение на паузу'),
  async execute(interaction, { queueManager }) {
    const queue = queueManager.get(interaction.guildId);
    const result = queue.pause();
    if (result) {
      await interaction.reply('Пауза включена.');
    } else {
      await interaction.reply({ content: 'Нечего ставить на паузу.', ephemeral: true });
    }
  }
};
