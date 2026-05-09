// src/commands/utilidades/ping.js
const { SlashCommandBuilder } = require('discord.js'); // sintaxe de desestruturação
// a ferramenta SlashCommandBuilder permite criar comandos de barra (slash commands) facilmente

module.exports = {
    // A propriedade 'data' define o comando para a API do Discord
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde com Pong! para testar o bot.'),

    // A propriedade 'execute' contém a lógica que o comando vai rodar
    async execute(interaction) { //async tem o await dentro dela e retorna uma Promise


        // 'interaction.reply()' envia uma resposta ao usuário que usou o comando
        await interaction.reply('chupa o meu pau');
    },
};