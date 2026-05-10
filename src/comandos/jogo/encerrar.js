// src/comandos/admin/encerrar.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const gameManager = require('../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('encerrar')
        .setDescription('Encerra a partida atual e limpa o estado do jogo. (Apenas host)'),

    async execute(interaction) {
        const channelId = interaction.channelId;

        // Opcional: Restringir a um cargo específico (descomente se quiser)
        // const HOST_ROLE_ID = 'ID_DO_CARGO_AQUI';
        // if (!interaction.member.roles.cache.has(HOST_ROLE_ID)) {
        //     return interaction.reply({
        //         content: '❌ Apenas moderadores podem encerrar o jogo.',
        //         flags: [MessageFlags.Ephemeral]
        //     });
        // }

        const status = gameManager.getGameStatus(channelId);
        if (!status) {
            return interaction.reply({
                content: 'ℹ️ Não há nenhuma partida ativa neste canal para encerrar.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Opcional: Exibir resumo antes de encerrar
        const players = Array.from(status.players || []);
        const embed = new EmbedBuilder()
            .setTitle('🔚 Partida Encerrada')
            .setDescription(`Jogo no canal <#${channelId}> foi finalizado manualmente.`)
            .addFields(
                { name: '📊 Status Final', value: status.status, inline: true },
                { name: '👥 Jogadores', value: players.length.toString(), inline: true }
            )
            .setColor(0x95a5a6);

        // Limpa o estado da memória
        gameManager.resetGame(channelId);

        // Confirmação pública
        await interaction.reply({
            content: '✅ Partida encerrada com sucesso!',
            embeds: [embed],
            flags: [MessageFlags.Ephemeral] // Só quem executou vê o resumo
        });

        // Opcional: Avisar no canal público que o jogo foi encerrado
        await interaction.channel.send('🔚 O host encerrou a partida. Use /novojogo para começar uma nova.');
    }
};