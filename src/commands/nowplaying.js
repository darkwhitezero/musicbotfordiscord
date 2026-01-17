const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Показать текущий трек'),
  async execute(interaction, { queueManager }) {
    const queue = queueManager.get(interaction.guildId);
    const nowPlaying = queue.getNowPlaying();
    if (!nowPlaying) {
      await interaction.reply({ content: 'Сейчас ничего не играет.', ephemeral: true });
      return;
    }

    await interaction.reply(`Сейчас играет: **${nowPlaying.title}**`);
  }
};
