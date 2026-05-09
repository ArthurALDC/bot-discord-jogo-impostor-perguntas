// src/events/interactionCreate.js
const { Events } = require('discord.js');
const gameManager = require('../utils/gameManager');

module.exports = {
    // Define que este arquivo vai ouvir o evento "InteractionCreate" (Interação Criada)
    name: Events.InteractionCreate,

    async execute(interaction) {
        // Handler para o menu de votação (StringSelectMenu)
        if (interaction.isStringSelectMenu && interaction.isStringSelectMenu() && interaction.customId === 'vote_impostor') {
            const { ActionRowBuilder, EmbedBuilder } = require('discord.js');
            const channelId = interaction.channelId;
            const voterId = interaction.user.id;
            const targetId = interaction.values[0];

            // Registra o voto
            const success = gameManager.castVote(channelId, voterId, targetId);
            if (!success) {
                return interaction.reply({ content: '❌ Você já votou nesta rodada.', ephemeral: true });
            }

            // Confirmação individual
            await interaction.reply({
                content: `✅ Voto em <@${targetId}> registrado!`,
                ephemeral: true
            });

            // Desabilita o menu para o usuário que votou
            const updatedRow = ActionRowBuilder.from(interaction.message.components[0])
                .setComponents(interaction.message.components[0].components.map(c => c.setDisabled(true)));
            await interaction.message.edit({ components: [updatedRow] });

            // Verifica se TODOS já votaram para finalizar a rodada
            if (gameManager.allPlayersVoted(channelId)) {
                const result = gameManager.calculateResult(channelId);
                if (result) {
                    const scoresArray = Object.entries(result.scores || {}).sort((a, b) => b[1] - a[1]);
                    const ranking = scoresArray.map(([id, pts], i) => `#${i + 1} <@${id}> — **${pts} pts**`).join('\n') || 'Nenhum ponto registrado.';

                    const embed = new EmbedBuilder()
                        .setTitle('🏆 Resultado da Rodada')
                        .setColor(result.wasImpostor ? 0x00ff00 : 0xff0000)
                        .setDescription(result.message)
                        .addFields(
                            { name: ' Ranking Atual', value: ranking, inline: false },
                            { name: '🎭 Identidade Revelada', value: result.reveal, inline: false }
                        );

                    await interaction.channel.send({ embeds: [embed] });
                }
            }
            return; // Não processa como comando
        }

        // 1. Verificação de Segurança
        if (!interaction.isChatInputCommand()) return;

        // INTEGRAÇÃO DIRETA: comando 'jogar' chama o gameManager
        if (interaction.commandName === 'jogar') {
            const joined = gameManager.joinGame(interaction.channelId, interaction.user.id, interaction.user.username);
            if (!joined) {
                return interaction.reply({ content: 'Jogo já em andamento ou erro.', ephemeral: true });
            }
            return interaction.reply({ content: 'Você entrou no lobby!', ephemeral: true });
        }

        // 2. Busca o Comando normalmente para outros comandos
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`Nenhum comando encontrado com o nome ${interaction.commandName}.`);
            return;
        }
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
            }
        }
    },
};