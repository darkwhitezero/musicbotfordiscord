const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Пропустить текущий трек'),
  async execute(interaction, { queueManager }) {
    const queue = queueManager.get(interaction.guildId);
    queue.skip();
    await interaction.reply('Трек пропущен.');
  }
};
