// src/events/ready.js
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady, // O nome do evento
    once: true, // Executar este evento apenas uma vez
    execute(client) {
        console.log(`Logado como ${client.user.tag}`);
    },
};