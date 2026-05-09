const { REST, Routes } = require('discord.js');
const { clientId, guildId } = require('./config.json');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// AJUSTE AQUI: Apontando para src/comandos
const foldersPath = path.join(__dirname, 'src', 'comandos');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[AVISO] O comando em ${filePath} está faltando "data" ou "execute".`);
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Iniciando o registro de ${commands.length} comandos (/).`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`${data.length} comandos (/) registrados com sucesso.`);
    } catch (error) {
        console.error(error);
    }
})();