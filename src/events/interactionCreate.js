// src/events/interactionCreate.js
const { Events } = require('discord.js');

module.exports = {
    // Define que este arquivo vai ouvir o evento "InteractionCreate" (Interação Criada)
    name: Events.InteractionCreate,

    async execute(interaction) {
        // 1. Verificação de Segurança
        // Se a interação NÃO for um comando de chat (ex: for um botão), ignora por enquanto.
        if (!interaction.isChatInputCommand()) return;

        // 2. Busca o Comando
        // O index.js já guardou todos os comandos na "Collection". Aqui a gente busca pelo nome.
        const command = interaction.client.commands.get(interaction.commandName);

        // Se por algum motivo o comando não existir na memória, para tudo.
        if (!command) {
            console.error(`Nenhum comando encontrado com o nome ${interaction.commandName}.`);
            return;
        }

        // 3. Executa o Comando
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            // Se der erro no código do comando, avisa o usuário
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
            }
        }
    },
};