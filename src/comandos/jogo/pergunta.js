// src/comandos/jogo/pergunta.js
const { SlashCommandBuilder } = require('discord.js');
const gameManager = require('../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pergunta')
        .setDescription('Receba sua pergunta secreta para a rodada (mensagem privada).'),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const userId = interaction.user.id;

        // 1. Validações de estado
        const status = gameManager.getGameStatus(channelId);
        if (!status) {
            return interaction.reply({ content: '❌ Não há partida ativa neste canal.', ephemeral: true });
        }
        if (status.status !== 'ANSWERING') {
            return interaction.reply({ content: '❌ Aguarde o início da fase de respostas ou use /iniciar primeiro.', ephemeral: true });
        }
        if (!status.players || !Array.from(status.players).includes(userId)) {
            // Nota: getGameStatus não retorna lista de IDs, então validamos no gameManager diretamente
            const game = gameManager.activeGames?.get(channelId);
            if (!game || !game.players.has(userId)) {
                return interaction.reply({ content: '❌ Você não está participando desta partida.', ephemeral: true });
            }
        }

        // 2. Obtém a pergunta específica para este jogador
        const promptData = gameManager.getPrompt(channelId, userId);
        if (!promptData) {
            return interaction.reply({ content: '❌ Erro ao recuperar sua pergunta. Tente novamente.', ephemeral: true });
        }

        // 3. Envia a pergunta de forma EFÊMERA (só o jogador vê)
        await interaction.reply({
            content: `🎭 **Sua pergunta:**\n\n> "${promptData.text}"\n\n` +
                `_Responda com o comando **/responder texto:"sua resposta"**._`,
            ephemeral: true
        });

        // 4. Log opcional para debug (não aparece no Discord)
        if (promptData.isImpostor) {
            console.log(`[DEBUG] Impostor ${interaction.user.tag} recebeu: "${promptData.text}"`);
        }
    }
};