const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Подключить бота к вашему голосовому каналу'),
    async execute(interaction, { queueManager }) {
        const voiceChannel = interaction.member?.voice?.channel;

        if (!voiceChannel) {
            await interaction.reply({
                content: '❌ Вы должны находиться в голосовом канале.',
                ephemeral: true
            });
            return;
        }

        const existingConnection = getVoiceConnection(interaction.guildId);

        if (existingConnection && existingConnection.joinConfig.channelId === voiceChannel.id) {
            await interaction.reply({
                content: '✅ Бот уже в вашем канале.',
                ephemeral: true
            });
            return;
        }

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            const queue = queueManager.get(interaction.guildId);
            queue.setConnection(connection);

            await interaction.reply(`🔊 Подключился к **${voiceChannel.name}**`);
        } catch (error) {
            console.error('Join error:', error);
            await interaction.reply({
                content: '❌ Не удалось подключиться к каналу.',
                ephemeral: true
            });
        }
    }
};
