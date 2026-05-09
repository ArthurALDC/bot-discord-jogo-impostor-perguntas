// src/events/interactionCreate.js
const { Events } = require('discord.js');
const gameManager = require('../utils/gameManager');

module.exports = {
    // Define que este arquivo vai ouvir o evento "InteractionCreate" (Interação Criada)
    name: Events.InteractionCreate,

    async execute(interaction) {
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