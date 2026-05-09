
// IMPORTAR AS BIBLIOTECAS
const { Collection } = require('discord.js'); // Importar a Collection do discord.js para armazenar os comandos
require('dotenv').config({ path: '../.env' }); // Importar as variáveis de ambiente do arquivo .env
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');


const client = new Client({
    intents: [ // Permissões
        GatewayIntentBits.Guilds // Precisa disso para eventos básicos do servidor
        , GatewayIntentBits.GuildMessages // Permite ler mensagens do servidor
        , GatewayIntentBits.MessageContent // Permite ler o conteúdo das mensagens
        , GatewayIntentBits.GuildMembers // Permite ler os membros do servidor
        , GatewayIntentBits.GuildMessageReactions // Permite ler as reações das mensagens

    ]

});


client.commands = new Collection();

const folder = path.join(__dirname, 'comandos'); // Caminho para a pasta de comandos // dirname é a pasta atual
const commandFolder = fs.readdirSync(folder); // Lê os arquivos da pasta de comandos

for (const folder of commandFolder) { // Para cada pasta dentro da pasta de comandos
    const commandsPath = path.join(folder, folder); // Caminho para a pasta de comandos
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    // readdirSync lê os arquivos da pasta de comandos e filter filtra apenas os arquivos .js

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[AVISO] O comando em ${filePath} está faltando a propriedade "data" ou "execute".`);
        }

    }
}

const path = require('node:path');
const fs = require('node:fs');

const eventsPath = path.join(__dirname, 'src', 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));



// Carregar os eventos 
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }




}


client.login(process.env.DISCORD_TOKEN); // Logar com o token do .env

