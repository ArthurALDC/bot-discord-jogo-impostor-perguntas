// src/comandos/jogo/novojogo.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const gameManager = require('../../utils/gameManager'); // Caminho corrigido: 2 níveis

module.exports = {
    // 1. Definição do comando (Obrigatório)
    data: new SlashCommandBuilder()
        .setName('novojogo')
        .setDescription('Cria uma nova sala de jogo (Lobby).'),

    // 2. Execução (Obrigatório ser async e ter reply)
    async execute(interaction) {
        const channelId = interaction.channelId;

        // Tenta criar o jogo
        const created = gameManager.createGame(channelId);

        if (!created) {
            // Responde se já existir um jogo
            return interaction.reply({
                content: '⚠️ Já existe uma partida ativa neste canal! Use /iniciar para começar.',
                ephemeral: true
            });
        }

        // Resposta imediata de sucesso (Essencial para não dar "Being built")
        await interaction.reply({
            content: '✅ **Nova sala criada!**\nJogadores, usem **/jogar** para entrar.',
            ephemeral: false
        });
    }
};