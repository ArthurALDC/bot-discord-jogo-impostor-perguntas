// src/utils/database.js

const questions = {
    // Perguntas que serão distribuídas para a maioria (Crewmates)
    players: [
        "Quantas vezes você toma banho por dia?",
        "Qual foi a última série que você maratonou?",
        "Se pudesse viajar para qualquer lugar agora, para onde iria?",
        // ... adicione conforme quiser
    ],

    // Perguntas "isca" ou desconexas para o Impostor
    // São genéricas, numéricas ou de tema totalmente distinto
    questions_imposters: [
        "Escolha um número de 1 a 10",
        "Se você fosse uma estação do ano, qual seria?",
        "Quantos dedos você tem na mão direita?",
        "Cite uma cor que combine com terça-feira",
        // ...
    ],

    questions_imposters_hard: [
        "Escolha um número de 10 a 20",
    ]
};

// Exporta o objeto para ser consumido pelo gameManager
module.exports = questions;