const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const gameManager = require('../../utils/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('votar')
        .setDescription('Abre o painel de votação para escolher o impostor.'),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const status = gameManager.getGameStatus(channelId);

        if (!status || status.status !== 'VOTING') {
            return interaction.reply({
                content: '❌ A votação ainda não está aberta. Aguarde a revelação das respostas.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Obtém jogadores ativos via getter seguro
        const players = gameManager.getActivePlayers(channelId);
        if (players.length === 0) {
            return interaction.reply({ content: '❌ Nenhum jogador encontrado na partida.', flags: [MessageFlags.Ephemeral] });
        }

        // Monta opções do menu
        const options = players.map(p => ({
            label: p.name,
            value: p.userId,
            description: `Votar em ${p.name}`
        }));

        // Cria o componente de seleção
        const menu = new StringSelectMenuBuilder()
            .setCustomId('vote_impostor')
            .setPlaceholder('Selecione quem você acha que é o impostor...')
            .addOptions(options)
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(menu);

        // Envia mensagem PÚBLICA para que todos possam interagir
        await interaction.reply({
            content: `🗳️ **Votação Aberta!**\nClique no menu abaixo e escolha o suspeito.`,
            components: [row],
            ephemeral: false
        });
    }
};