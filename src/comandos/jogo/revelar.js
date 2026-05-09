const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const gameManager = require('../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('revelar')
        .setDescription('Revela as respostas e a pergunta base da rodada. (Apenas host)'),

    async execute(interaction) {
        const channelId = interaction.channelId;

        // Validação: só quem iniciou pode revelar? (Opcional: adicionar verificação de permissão)
        const status = gameManager.getGameStatus(channelId);
        if (!status) {
            return interaction.reply({ content: '❌ Não há partida ativa.', ephemeral: true });
        }
        if (status.status !== 'REVEALING') {
            return interaction.reply({ content: '❌ Aguarde todos responderem para revelar.', ephemeral: true });
        }

        // 1. Obtém as respostas públicas
        const answers = gameManager.getPublicAnswers(channelId);
        if (!answers) {
            return interaction.reply({ content: '❌ Erro ao recuperar respostas.', ephemeral: true });
        }

        // 2. Monta o Embed com as respostas
        const answersText = answers
            .map((a, i) => `**${i + 1}.** <@${a.userId}>: _${a.answer}_`)
            .join('\n');

        const embedAnswers = new EmbedBuilder()
            .setTitle('📝 Respostas dos Jogadores')
            .setDescription(answersText)
            .setColor(0x3498db);

        // 3. Revela a pergunta base e inicia a votação
        const baseQuestion = gameManager.revealQuestionAndStartVoting(channelId);

        const embedQuestion = new EmbedBuilder()
            .setTitle('🔍 Pergunta Oficial da Rodada')
            .setDescription(`> "${baseQuestion}"`)
            .setColor(0xe74c3c)
            .setFooter({ text: 'Agora é hora de votar! Use /votar @jogador' });

        // Envia tudo no canal público
        await interaction.reply({
            content: '🎭 **Fase de revelação!** Analisem as respostas e votem em quem parece ter recebido uma pergunta diferente.',
            embeds: [embedAnswers, embedQuestion]
        });

        // Dica: em produção, você pode querer restringir este comando a um cargo específico
        // if (!interaction.member.roles.cache.has('ROLE_ID_DO_HOST')) { ... }
    }
};