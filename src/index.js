// IMPORTAR AS BIBLIOTECAS
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// Importar as variáveis de ambiente do arquivo .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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

// Carregar comandos
const commandsDir = path.join(__dirname, 'comandos');
const commandSubfolders = fs.readdirSync(commandsDir);

for (const subfolder of commandSubfolders) {
    const commandPath = path.join(commandsDir, subfolder);

    if (fs.statSync(commandPath).isDirectory()) {
        const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.log(`[AVISO] O comando em ${filePath} está faltando a propriedade "data" ou "execute".`);
            }
        }
    }
}

// Carregar eventos (caminho corrigido)
const eventsPath = path.join(__dirname, 'events');
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

process.on('unhandledRejection', (error) => {
    console.error('[ERROR] Unhandled rejection:', error);
    // Não encerra o bot, apenas loga o erro
});