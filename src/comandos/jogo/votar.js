const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const gameManager = require('../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('votar')
        .setDescription('Vota em quem você acha que é o impostor.')
        .addUserOption(option =>
            option.setName('jogador')
                .setDescription('O jogador que você deseja votar.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const voterId = interaction.user.id;
        const targetUser = interaction.options.getUser('jogador');
        const targetId = targetUser.id;

        // 1. Validação: verifica se o jogo existe e está na fase de votação
        const gameStatus = gameManager.getGameStatus(channelId);
        if (!gameStatus) {
            return interaction.reply({ content: '❌ Não há nenhuma partida ativa neste canal.', ephemeral: true });
        }
        if (gameStatus.status !== 'VOTING') {
            return interaction.reply({ content: '❌ Aguarde a fase de votação para votar.', ephemeral: true });
        }

        // 2. Registra o voto no gameManager
        const voteSuccess = gameManager.castVote(channelId, voterId, targetId);
        if (!voteSuccess) {
            return interaction.reply({ content: '❌ Não foi possível registrar seu voto. Verifique se você já votou ou se o jogador é válido.', ephemeral: true });
        }

        // 3. Confirmação individual (ephemeral)
        await interaction.reply({
            content: `✅ Seu voto em **${targetUser.tag}** foi registrado! Aguarde o fim da votação.`,
            ephemeral: true
        });

        // 4. Verifica se TODOS os jogadores já votaram para encerrar a rodada
        // (Assumindo que o gameManager tenha um método para checar isso, ou fazemos manualmente)
        // Nota: idealmente, criar um método público no gameManager: 'allPlayersVoted(channelId)'

        // Agora usando método público do gameManager para checar se todos votaram
        if (gameManager.allPlayersVoted(channelId)) {
            setTimeout(() => finalizeRound(channelId, interaction.channel), 1000);
        }
    }
};

/**
 * Função auxiliar para finalizar a rodada e exibir o ranking
 * (Pode ser movida para o gameManager depois)
 */
async function finalizeRound(channelId, channel) {
    const result = gameManager.calculateResult(channelId);
    if (!result) return;

    // Monta ranking ordenado
    const scoresArray = Object.entries(result.scores || {});
    scoresArray.sort((a, b) => b[1] - a[1]);

    let ranking = scoresArray.length > 0
        ? scoresArray.map(([userId, score], index) => `#${index + 1} <@${userId}> — **${score} ponto(s)**`).join('\n')
        : 'Nenhum ponto registrado ainda.';

    const embed = new EmbedBuilder()
        .setTitle('🏆 Ranking Atual da Partida')
        .setDescription(ranking)
        .setColor(result.wasImpostor ? 0x00ff00 : 0xff0000) // Verde se pegaram o impostor, vermelho se ele escapou
        .setFooter({ text: result.message });

    // Mensagem pública com o resultado
    await channel.send({ embeds: [embed] });

    // Reiniciar automaticamente para a próxima rodada após 15 segundos
    setTimeout(async () => {
        const next = gameManager.nextRound(channelId);
        if (next) {
            await channel.send('🔄 Nova rodada iniciada! Use /pergunta para receber sua tarefa.');
        } else {
            await channel.send('⚠️ Não foi possível iniciar uma nova rodada.');
        }
    }, 15000);
}