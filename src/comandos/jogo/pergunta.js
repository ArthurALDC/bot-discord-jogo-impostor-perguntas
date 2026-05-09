const { SlashCommandBuilder } = require('discord.js');
const gameManager = require('../../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pergunta')
        .setDescription('Receba sua pergunta secreta para a rodada.'),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const userId = interaction.user.id;

        // Validação: existe jogo e está na fase correta?
        const status = gameManager.getGameStatus(channelId);
        if (!status) {
            return interaction.reply({ content: '❌ Não há partida ativa neste canal.', ephemeral: true });
        }
        if (status.status !== 'ANSWERING') {
            return interaction.reply({ content: '❌ Aguarde o início da fase de respostas.', ephemeral: true });
        }

        // Obtém a pergunta específica para este jogador
        const promptData = gameManager.getPrompt(channelId, userId);
        if (!promptData) {
            return interaction.reply({ content: '❌ Erro ao recuperar sua pergunta. Tente novamente.', ephemeral: true });
        }

        // Envia a pergunta de forma EFÊMERA (só o jogador vê)
        await interaction.reply({
            content: `🎭 **Sua pergunta:**\n> "${promptData.text}"\n\n_Responda com o comando **/responder**._`,
            ephemeral: true
        });

        // Log opcional para debug (não aparece no Discord)
        if (promptData.isImpostor) {
            console.log(`[DEBUG] Impostor ${interaction.user.tag} recebeu: "${promptData.text}"`);
        }
    }
};