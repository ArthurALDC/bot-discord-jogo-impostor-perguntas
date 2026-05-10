// src/comandos/jogo/iniciar.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const gameManager = require('../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iniciar')
        .setDescription('Inicia a partida e distribui as perguntas.'),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const gameData = gameManager.startGame(channelId);
        if (!gameData) {
            return interaction.reply({
                content: '❌ Não foi possível iniciar. Verifique se há pelo menos 3 jogadores no lobby.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Cria o botão para receber a pergunta
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_prompt')
                .setLabel('🎭 Receber Minha Pergunta')
                .setStyle(ButtonStyle.Primary)
        );

        // Mensagem pública com o botão
        await interaction.reply({
            content: `🎮 **Partida iniciada!**\n📋 Tema: _${gameData.tema}_\n\n **Cada jogador deve clicar no botão abaixo** para receber sua pergunta secreta (mensagem privada).`,
            components: [row],
            ephemeral: false
        });
    }
};