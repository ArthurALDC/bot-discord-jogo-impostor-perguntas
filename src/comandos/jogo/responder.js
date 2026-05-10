const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const gameManager = require('../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('responder')
        .setDescription('Envia sua resposta para a rodada.')
        .addStringOption(option =>
            option.setName('texto')
                .setDescription('Sua resposta para a pergunta.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const userId = interaction.user.id;
        const answerText = interaction.options.getString('texto');

        // Validação de fase
        const status = gameManager.getGameStatus(channelId);
        if (!status) {
            return interaction.reply({ content: '❌ Não há partida ativa neste canal.', flags: [MessageFlags.Ephemeral] });
        }
        if (status.status !== 'ANSWERING') {
            return interaction.reply({ content: '❌ A fase de respostas já encerrou.', flags: [MessageFlags.Ephemeral] });
        }

        // Registra a resposta no gameManager
        const result = gameManager.submitAnswer(channelId, userId, answerText);

        if (!result.success) {
            return interaction.reply({ content: `❌ ${result.message}`, flags: [MessageFlags.Ephemeral] });
        }

        // Confirmação efêmera
        await interaction.reply({
            content: `✅ Resposta registrada!\n${result.allAnswered ? '🎉 Todos responderam! Use **/revelar** para continuar.' : `⏳ Aguardando ${result.remaining} jogador(es)...`}`,
            flags: [MessageFlags.Ephemeral]
        });

        // Se todos responderam, avisa no canal público (opcional)
        if (result.allAnswered) {
            await interaction.channel.send('✨ Todos os jogadores responderam! O host pode usar `/revelar` para prosseguir.');
        }
    }
};