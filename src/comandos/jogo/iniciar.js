// src/comandos/jogo/iniciar.js
const { SlashCommandBuilder } = require('discord.js');
const gameManager = require('../../utils/gameManager');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('iniciar')
        .setDescription('Inicia a partida. Jogadores devem usar /pergunta para receber a tarefa.'),

    async execute(interaction) {
        const channelId = interaction.channelId;

        // 1. Inicia o jogo
        const gameData = gameManager.startGame(channelId);
        if (!gameData) {
            return interaction.reply({
                content: '❌ Não foi possível iniciar. Verifique se há pelo menos 3 jogadores no lobby.',
                ephemeral: true
            });
        }

        // 2. Mensagem pública com instruções claras
        // Observação: Não enviamos as perguntas aqui pois ephemeral exige interação do usuário
        await interaction.reply({
            content: `🎮 **Partida iniciada!**\n\n` +
                `📋 Tema: _${gameData.tema}_\n` +
                `👥 Jogadores: ${gameData.totalPlayers}\n\n` +
                `🎭 **Cada jogador deve usar o comando **/pergunta** agora para receber sua tarefa secreta.**\n` +
                `⚠️ A mensagem será visível apenas para você.`,
            ephemeral: false
        });
    }
};