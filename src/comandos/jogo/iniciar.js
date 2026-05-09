// src/comandos/iniciar.js
const { SlashCommandBuilder } = require('discord.js');
const gameManager = require('../../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iniciar')
        .setDescription('Inicia a partida e distribui as perguntas. (Apenas host)'),

    async execute(interaction) {
        // Opcional: verificar se é o host com interaction.member.roles
        const channelId = interaction.channelId;

        const gameData = gameManager.startGame(channelId);
        if (!gameData) {
            return interaction.reply({ content: '❌ Não foi possível iniciar. Verifique se há jogadores suficientes no lobby.', ephemeral: true });
        }

        await interaction.reply({
            content: `🎮 **Partida iniciada!**\nTema: _${gameData.tema}_\n\nCada jogador deve usar **/pergunta** para receber sua tarefa.`,
            ephemeral: false
        });
    }
};