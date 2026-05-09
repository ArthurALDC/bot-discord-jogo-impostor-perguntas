// src/utils/gameManager.js

const path = require('node:path');
const fs = require('node:fs');

// =============================================================================
// CARREGAMENTO DO BANCO DE DADOS
// =============================================================================
// Resolve o caminho para src/data/questions.json independentemente de onde o bot é executado
const questionsPath = path.join(__dirname, '..', 'data', 'questions.json');

let database = [];
try {
    const rawData = fs.readFileSync(questionsPath, 'utf-8');
    database = JSON.parse(rawData);
    console.log(`[GameManager] Banco de perguntas carregado: ${database.length} temas.`);
} catch (err) {
    console.error(`[ERROR] Falha ao carregar questions.json: ${err.message}`);
    // Fallback vazio para não quebrar o boot do bot, mas o jogo não funcionará
    database = [];
}

// =============================================================================
// ARMAZENAMENTO DE ESTADO (Singleton em Memória)
// =============================================================================
// Chave: channelId (string) | Valor: objeto GameSession
const activeGames = new Map();

class GameManager {
        /**
         * Verifica se todos os jogadores já votaram na rodada atual
         * @param {string} channelId
         * @returns {boolean}
         */
        allPlayersVoted(channelId) {
            const game = activeGames.get(channelId);
            if (!game || !game.players || !game.votes) return false;
            return game.votes.size >= game.players.size;
        }
    /**
     * Inicia uma nova rodada no mesmo canal, mantendo jogadores e placar.
     * Reseta respostas, votos, sorteia novo impostor e tema.
     * @param {string} channelId
     * @returns {object|null} - Dados da nova rodada ou null se falhar
     */
    nextRound(channelId) {
        const game = activeGames.get(channelId);
        if (!game) return null;
        if (!game.players || game.players.size < 3) return null;

        // Reset respostas e votos
        game.players.forEach((player) => {
            player.hasAnswered = false;
            player.answer = null;
            player.role = 'jogador';
        });
        game.votes = new Map();

        // Sorteia novo impostor
        const playersArray = Array.from(game.players.keys());
        const randomIndex = Math.floor(Math.random() * playersArray.length);
        game.impostorId = playersArray[randomIndex];
        const impostorData = game.players.get(game.impostorId);
        if (impostorData) impostorData.role = 'impostor';

        // Sorteia novo tema
        const selectedTheme = database[Math.floor(Math.random() * database.length)];
        const impostorVariation = selectedTheme.variacoes[
            Math.floor(Math.random() * selectedTheme.variacoes.length)
        ];
        game.questionData = {
            tema: selectedTheme.tema,
            base: selectedTheme.perguntaBase,
            impostor: impostorVariation
        };

        // Atualiza metadados
        game.status = 'ANSWERING';
        game.metadata.round = (game.metadata.round || 1) + 1;
        game.metadata.startedAt = Date.now();

        return {
            tema: game.questionData.tema,
            totalPlayers: game.players.size,
            impostorCount: 1,
            round: game.metadata.round
        };
    }

    // ---------------------------------------------------------------------------
    // CONFIGURAÇÃO E LOBBY
    // ---------------------------------------------------------------------------

    /**
     * Inicializa uma nova sessão de jogo para um canal específico
     * @param {string} channelId - ID do canal do Discord
     * @returns {boolean} - Sucesso da criação
     */
    createGame(channelId) {
        if (activeGames.has(channelId)) return false;

        activeGames.set(channelId, {
            status: 'LOBBY',           // LOBBY | ANSWERING | REVEALING | VOTING | ENDED
            players: new Map(),        // userId -> { role, hasAnswered, answer }
            questionData: null,        // { base, impostor, tema }
            impostorId: null,          // userId do impostor
            votes: new Map(),          // voterId -> targetId
            metadata: {
                startedAt: null,
                round: 1
            }
        });
        return true;
    }

    /**
     * Adiciona um jogador ao lobby de uma partida existente
     * @param {string} channelId 
     * @param {string} userId 
     * @param {string} userName - Opcional, para logs
     * @returns {boolean}
     */
    joinGame(channelId, userId, userName = 'Desconhecido') {
        const game = activeGames.get(channelId);
        // Validação de estado: só entra se estiver no lobby
        if (!game || game.status !== 'LOBBY') return false;
        if (game.players.has(userId)) return true; // Já está no jogo

        game.players.set(userId, {
            name: userName,
            role: 'jogador',           // Papel padrão
            hasAnswered: false,
            answer: null
        });
        return true;
    }

    /**
     * Lista jogadores no lobby (para comandos de status)
     */
    getLobbyPlayers(channelId) {
        const game = activeGames.get(channelId);
        if (!game || game.status !== 'LOBBY') return [];
        return Array.from(game.players.values()).map(p => p.name);
    }

    /**
     * Finaliza o lobby, sorteia papéis e perguntas, e inicia a fase de respostas
     * @param {string} channelId 
     * @returns {object|null} - Dados da pergunta para log/debug, ou null se falhar
     */
    startGame(channelId) {
        const game = activeGames.get(channelId);
        if (!game) return null;
        if (game.status !== 'LOBBY') return null;
        if (game.players.size < 3) return null; // Mínimo para o jogo fazer sentido

        // 1. Sortear o Impostor
        const playersArray = Array.from(game.players.keys());
        const randomIndex = Math.floor(Math.random() * playersArray.length);
        game.impostorId = playersArray[randomIndex];

        // Atualiza o papel do sorteado
        const impostorData = game.players.get(game.impostorId);
        if (impostorData) impostorData.role = 'impostor';

        // 2. Sortear o Tema do Banco de Dados
        const selectedTheme = database[Math.floor(Math.random() * database.length)];

        // 3. Sortear a Variação para o Impostor
        // Garante que o impostor receba uma pergunta do mesmo contexto, mas diferente
        const impostorVariation = selectedTheme.variacoes[
            Math.floor(Math.random() * selectedTheme.variacoes.length)
        ];

        // 4. Armazenar dados da rodada (encapsulados)
        game.questionData = {
            tema: selectedTheme.tema,
            base: selectedTheme.perguntaBase,      // Para os jogadores
            impostor: impostorVariation            // Para o impostor
        };

        // 5. Transição de Estado
        game.status = 'ANSWERING';
        game.metadata.startedAt = Date.now();

        // Retorna dados sanitizados (sem expor quem é o impostor)
        return {
            tema: game.questionData.tema,
            totalPlayers: game.players.size,
            impostorCount: 1
        };
    }

    /**
     * Retorna a pergunta correta baseada no papel do usuário
     * @param {string} channelId 
     * @param {string} userId 
     * @returns {object|null} - { text: string, isImpostor: boolean }
     */
    getPrompt(channelId, userId) {
        const game = activeGames.get(channelId);
        if (!game || game.status !== 'ANSWERING') return null;

        const isImpostor = userId === game.impostorId;

        return {
            text: isImpostor ? game.questionData.impostor : game.questionData.base,
            isImpostor: isImpostor, // Pode ser útil para log ou mensagem de confirmação privada
            tema: game.questionData.tema
        };
    }

    // ---------------------------------------------------------------------------
    // COLETA DE RESPOSTAS
    // ---------------------------------------------------------------------------

    /**
     * Registra a resposta de um jogador e verifica se a rodada pode avançar
     * @param {string} channelId 
     * @param {string} userId 
     * @param {string} answerText 
     * @returns {object} - { success: boolean, allAnswered: boolean, message?: string }
     */
    submitAnswer(channelId, userId, answerText) {
        const game = activeGames.get(channelId);

        // Validações de estado e existência
        if (!game) return { success: false, allAnswered: false, message: 'Partida não encontrada.' };
        if (game.status !== 'ANSWERING') return { success: false, allAnswered: false, message: 'Aguarde a fase de respostas.' };

        const player = game.players.get(userId);
        if (!player) return { success: false, allAnswered: false, message: 'Você não está nesta partida.' };
        if (player.hasAnswered) return { success: false, allAnswered: false, message: 'Você já respondeu esta rodada.' };

        // Salva a resposta
        player.answer = answerText.trim();
        player.hasAnswered = true;

        // Verifica condição de vitória de fase: todos responderam?
        const allAnswered = Array.from(game.players.values()).every(p => p.hasAnswered);

        if (allAnswered) {
            game.status = 'REVEALING';
        }

        return {
            success: true,
            allAnswered: allAnswered,
            remaining: allAnswered ? 0 : Array.from(game.players.values()).filter(p => !p.hasAnswered).length
        };
    }

    // ---------------------------------------------------------------------------
    // REVELAÇÃO E VOTAÇÃO
    // ---------------------------------------------------------------------------

    /**
     * Prepara o payload público com as respostas (sem revelar quem é o impostor ainda)
     * @param {string} channelId 
     * @returns {Array|null} - Lista de { userName, answer } ou null
     */
    getPublicAnswers(channelId) {
        const game = activeGames.get(channelId);
        if (!game || game.status !== 'REVEALING') return null;

        const results = [];
        game.players.forEach((data, userId) => {
            results.push({
                userId: userId, // Mantém ID para vincular com votação depois
                userName: data.name,
                answer: data.answer
            });
        });
        return results;
    }

    /**
     * Revela a pergunta base oficial e libera a votação
     * @param {string} channelId 
     * @returns {string|null} - A pergunta base oficial
     */
    revealQuestionAndStartVoting(channelId) {
        const game = activeGames.get(channelId);
        if (!game || game.status !== 'REVEALING') return null;

        game.status = 'VOTING';
        return game.questionData.base;
    }

    /**
     * Registra o voto de um jogador em outro
     */
    castVote(channelId, voterId, targetId) {
        const game = activeGames.get(channelId);
        if (!game || game.status !== 'VOTING') return false;

        // Validações básicas de voto
        if (!game.players.has(voterId) || !game.players.has(targetId)) return false;
        if (voterId === targetId) return false; // Não pode votar em si mesmo
        if (game.votes.has(voterId)) return false; // Já votou

        game.votes.set(voterId, targetId);
        return true;
    }

    /**
     * Calcula o resultado da votação e distribui pontos (sem eliminação)
   * @param {string} channelId 
   * @returns {object|null} - Resultado { mostVotedId, wasImpostor, scores, message }
   */
    calculateResult(channelId) {
        const game = activeGames.get(channelId);
        if (!game || game.status !== 'VOTING') return null;

        // Contagem de votos
        const voteCounts = new Map();
        game.votes.forEach((targetId) => {
            voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
        });

        // Encontrar o mais votado (pode haver empate)
        let mostVotedId = null;
        let maxVotes = -1;
        let tie = false;

        voteCounts.forEach((count, id) => {
            if (count > maxVotes) {
                maxVotes = count;
                mostVotedId = id;
                tie = false;
            } else if (count === maxVotes) {
                tie = true;
            }
        });

        // Inicializa scores se não existir (primeira rodada)
        if (!game.scores) {
            game.scores = new Map();
            game.players.forEach((_, userId) => game.scores.set(userId, 0));
        }

        // Lógica de pontuação
        const wasImpostorVoted = (mostVotedId === game.impostorId);
        const impostor = game.players.get(game.impostorId);

        if (wasImpostorVoted && !tie) {
            // Jogadores acertaram: todos que votaram no impostor ganham 1 ponto
            game.votes.forEach((targetId, voterId) => {
                if (targetId === game.impostorId) {
                    const currentScore = game.scores.get(voterId) || 0;
                    game.scores.set(voterId, currentScore + 1);
                }
            });
            // Impostor não ganha ponto
        } else {
            // Impostor passou despercebido (empate ou não foi o mais votado)
            if (impostor) {
                const currentScore = game.scores.get(game.impostorId) || 0;
                game.scores.set(game.impostorId, currentScore + 1);
            }
            // Jogadores não ganham ponto nesta rodada
        }

        // Prepara payload de resultado
        const result = {
            mostVotedId: tie ? null : mostVotedId,
            mostVotedName: tie ? null : game.players.get(mostVotedId)?.name,
            wasImpostor: wasImpostorVoted && !tie,
            tie: tie,
            scores: Object.fromEntries(game.scores), // Converte Map para objeto puro
            message: tie
                ? 'Empate! Ninguém foi apontado com certeza. Impostor ganha 1 ponto por passar despercebido.'
                : wasImpostorVoted
                    ? `Vocês identificaram o impostor: ${impostor?.name}! Jogadores que votaram nele ganham 1 ponto.`
                    : `O impostor passou despercebido! ${impostor?.name} ganha 1 ponto.`
        };

        // Mantém o status em 'ENDED' para indicar fim da rodada, mas não limpa o jogo
        game.status = 'ROUND_ENDED';

        // Lógica de vitória
        // Se houve empate ou ninguém votou, ninguém sai (vitória parcial dos jogadores ou empate)
        if (tie || mostVotedId === null) {
            return {
                ...result,
                eliminatedId: null,
                eliminatedName: null,
                winner: 'draw',
                reveal: `O impostor era: ${game.players.get(game.impostorId)?.name}`
            };
        }

        const wasImpostor = (mostVotedId === game.impostorId);

        return {
            ...result,
            eliminatedId: mostVotedId,
            eliminatedName: game.players.get(mostVotedId)?.name,
            wasImpostor: wasImpostor,
            winner: wasImpostor ? 'jogadores' : 'impostor',
            reveal: `O impostor era: ${game.players.get(game.impostorId)?.name}`
        };
    }

    // ---------------------------------------------------------------------------
    // UTILITÁRIOS E LIMPEZA
    // ---------------------------------------------------------------------------

    /**
     * Remove a partida da memória
     */
    resetGame(channelId) {
        return activeGames.delete(channelId);
    }

    /**
     * Getter para debug: verifica status de uma partida
     */
    getGameStatus(channelId) {
        const game = activeGames.get(channelId);
        if (!game) return null;
        return {
            status: game.status,
            players: game.players.size,
            impostorId: game.impostorId // Cuidado ao expor isso em logs públicos!
        };
    }
}

// Exporta uma instância única (Singleton)
module.exports = new GameManager();