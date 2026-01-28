const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Установить громкость воспроизведения')
        .addIntegerOption((option) =>
            option
                .setName('value')
                .setDescription('Громкость от 0 до 100')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)
        ),
    async execute(interaction, { queueManager }) {
        const value = interaction.options.getInteger('value', true);
        const queue = queueManager.get(interaction.guildId);

        queue.setVolume(value);

        const volumeBar = '█'.repeat(Math.floor(value / 10)) + '░'.repeat(10 - Math.floor(value / 10));
        await interaction.reply(`🔊 Громкость: ${value}% [${volumeBar}]`);
    }
};
