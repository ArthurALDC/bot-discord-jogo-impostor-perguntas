const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const gameManager = require('../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jogar')
        .setDescription('Entra no lobby da partida atual.'),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const userId = interaction.user.id;
        const userName = interaction.user.username;

        const joined = gameManager.joinGame(channelId, userId, userName);
        if (!joined) {
            return interaction.reply({
                content: '️ Não foi possível entrar. Já existe um jogo em andamento ou você já está no lobby.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Pega a lista atualizada após o ingresso
        const players = gameManager.getLobbyPlayers(channelId);
        const embed = new EmbedBuilder()
            .setTitle(' Lobby Atualizado')
            .setDescription(players.map(p => `• ${p}`).join('\n'))
            .setColor(0x2ecc71);

        await interaction.reply({
            content: '✅ Você entrou no lobby!',
            embeds: [embed],
            flags: [MessageFlags.Ephemeral]
        });
    }
};
