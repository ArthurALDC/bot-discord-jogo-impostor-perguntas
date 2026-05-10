// src/comandos/jogo/pergunta.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const gameManager = require('../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pergunta')
        .setDescription('Receba sua pergunta secreta para a rodada (mensagem privada).'),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const userId = interaction.user.id;

        // 1. Validação de estado e participação
        const status = gameManager.getGameStatus(channelId);
        if (!status || status.status !== 'ANSWERING') {
            return interaction.reply({
                content: '❌ Aguarde o início da fase de respostas ou use /iniciar primeiro.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Validação correta usando o método público
        if (!gameManager.isPlayerInGame(channelId, userId)) {
            return interaction.reply({
                content: '❌ Você não está participando desta partida.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // 2. Obtém a pergunta específica para este jogador
        const promptData = gameManager.getPrompt(channelId, userId);
        if (!promptData) {
            return interaction.reply({ content: '❌ Erro ao recuperar sua pergunta. Tente novamente.', flags: [MessageFlags.Ephemeral] });
        }

        // 3. Envia a pergunta de forma EFÊMERA (só o jogador vê)
        await interaction.reply({
            content: `🎭 **Sua pergunta:**\n\n> "${promptData.text}"\n\n` +
                `_Responda com o comando **/responder texto:\"sua resposta\"**._`,
            flags: [MessageFlags.Ephemeral]
        });

        // 4. Log opcional para debug (não aparece no Discord)
        if (promptData.isImpostor) {
            console.log(`[DEBUG] Impostor ${interaction.user.tag} recebeu: "${promptData.text}"`);
        }
    }
};