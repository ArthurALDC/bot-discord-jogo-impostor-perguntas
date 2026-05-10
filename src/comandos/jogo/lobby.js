// src/comandos/jogo/lobby.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const gameManager = require('../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lobby')
        .setDescription('Exibe a lista atual de jogadores na sala.'),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const status = gameManager.getGameStatus(channelId);

        if (!status || status.status !== 'LOBBY') {
            return interaction.reply({
                content: '❌ Não há lobby ativo neste canal.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const players = gameManager.getLobbyPlayers(channelId);
        if (players.length === 0) {
            return interaction.reply({
                content: '📋 Lobby vazio. Use **/jogar** para entrar.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(' Jogadores no Lobby')
            .setDescription(players.map((name, i) => `${i + 1}. ${name}`).join('\n'))
            .setColor(0x3498db)
            .setFooter({ text: `Total: ${players.length} jogador(es)` });

        await interaction.reply({
            embeds: [embed],
            flags: [MessageFlags.Ephemeral]
        });
    }
};