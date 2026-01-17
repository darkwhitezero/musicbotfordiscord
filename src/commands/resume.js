const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Продолжить воспроизведение'),
  async execute(interaction, { queueManager }) {
    const queue = queueManager.get(interaction.guildId);
    const result = queue.resume();
    if (result) {
      await interaction.reply('Воспроизведение продолжено.');
    } else {
      await interaction.reply({ content: 'Нечего продолжать.', ephemeral: true });
    }
  }
};
