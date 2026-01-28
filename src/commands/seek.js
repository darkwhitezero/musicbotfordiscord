const { SlashCommandBuilder } = require('discord.js');
const { formatDuration } = require('../utils/spotify');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Перемотать трек на указанную секунду')
        .addIntegerOption((option) =>
            option
                .setName('seconds')
                .setDescription('Секунда, на которую перемотать')
                .setRequired(true)
                .setMinValue(0)
        ),
    async execute(interaction, { queueManager }) {
        const seconds = interaction.options.getInteger('seconds', true);
        const queue = queueManager.get(interaction.guildId);

        const current = queue.getNowPlaying();
        if (!current) {
            await interaction.reply({
                content: '❌ Сейчас ничего не воспроизводится.',
                ephemeral: true
            });
            return;
        }

        // Limit to track duration if known
        const maxSeconds = current.duration || Infinity;
        const targetSeconds = Math.min(Math.max(0, seconds), maxSeconds);

        const success = queue.seekTo(targetSeconds);
        if (success) {
            await interaction.reply(`⏩ Перемотка на ${formatDuration(targetSeconds)}`);
        } else {
            await interaction.reply({
                content: '❌ Не удалось перемотать.',
                ephemeral: true
            });
        }
    }
};
