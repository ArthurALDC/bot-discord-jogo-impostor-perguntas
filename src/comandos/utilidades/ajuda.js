// src/comandos/utilidades/ajuda.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ajuda')
        .setDescription('Exibe informações sobre o bot.'),

    async execute(interaction) {
        await interaction.reply({ content: '📚 Comandos disponíveis: /iniciar, /pergunta, /responder, /revelar, /votar', ephemeral: true });
    }
};