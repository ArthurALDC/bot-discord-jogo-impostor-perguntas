const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpergunta') // <--- Mude o nome aqui para cada arquivo (votar, config, etc)
        .setDescription('Comando em construção'),
    async execute(interaction) {
        await interaction.reply('Este comando ainda está sendo construído!');
    },
};