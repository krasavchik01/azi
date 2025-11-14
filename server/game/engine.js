const Deck = require('./deck');
const Card = require('./card');

class GameEngine {
    constructor(io) {
        this.io = io;
        this.rooms = new Map();
        this.players = new Map();
        this.waitingPlayers = [];
    }

    addPlayer(socket, playerName) {
        const player = {
            id: socket.id,
            name: playerName || `Player ${socket.id.substring(0, 4)}`,
            socket: socket,
            health: 30,
            mana: 1,
            maxMana: 1,
            hand: [],
            board: [],
            deck: new Deck()
        };

        this.players.set(socket.id, player);

        // Try to match with waiting player
        if (this.waitingPlayers.length > 0) {
            const opponent = this.waitingPlayers.shift();
            this.createGame(player, opponent);
        } else {
            this.waitingPlayers.push(player);
            socket.emit('waiting', { message: 'Waiting for opponent...' });
        }
    }

    createGame(player1, player2) {
        const roomId = `room_${Date.now()}`;

        const gameState = {
            id: roomId,
            players: [player1, player2],
            currentPlayerIndex: 0,
            turn: 1,
            status: 'active'
        };

        this.rooms.set(roomId, gameState);
        player1.roomId = roomId;
        player2.roomId = roomId;

        // Join socket rooms
        player1.socket.join(roomId);
        player2.socket.join(roomId);

        // Draw initial cards
        this.drawCards(player1, 4);
        this.drawCards(player2, 4);

        // Start game
        this.io.to(roomId).emit('gameStart', {
            room: roomId,
            players: [
                { id: player1.id, name: player1.name, health: player1.health },
                { id: player2.id, name: player2.name, health: player2.health }
            ]
        });

        this.startTurn(roomId);
    }

    drawCards(player, count) {
        for (let i = 0; i < count; i++) {
            const card = player.deck.draw();
            if (card) {
                player.hand.push(card);
            }
        }

        player.socket.emit('updateHand', { hand: player.hand });
    }

    startTurn(roomId) {
        const game = this.rooms.get(roomId);
        if (!game || game.status !== 'active') return;

        const currentPlayer = game.players[game.currentPlayerIndex];

        // Increase max mana (up to 10)
        if (currentPlayer.maxMana < 10) {
            currentPlayer.maxMana++;
        }
        currentPlayer.mana = currentPlayer.maxMana;

        // Draw a card
        this.drawCards(currentPlayer, 1);

        // Reset board cards
        currentPlayer.board.forEach(card => {
            card.canAttack = true;
            card.hasUsedAbility = false;
        });

        this.io.to(roomId).emit('turnStart', {
            turn: game.turn,
            currentPlayerId: currentPlayer.id,
            playerName: currentPlayer.name
        });

        this.broadcastGameState(roomId);
    }

    playCard(playerId, data) {
        const player = this.players.get(playerId);
        if (!player) return;

        const game = this.rooms.get(player.roomId);
        if (!game) return;

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerId) {
            player.socket.emit('error', { message: 'Not your turn!' });
            return;
        }

        const cardIndex = data.cardIndex;
        const card = player.hand[cardIndex];

        if (!card) return;

        if (player.mana < card.cost) {
            player.socket.emit('error', { message: 'Not enough mana!' });
            return;
        }

        // Play the card
        player.mana -= card.cost;
        player.hand.splice(cardIndex, 1);

        if (card.type === 'minion') {
            card.canAttack = false; // Summoning sickness
            player.board.push(card);
        } else if (card.type === 'spell') {
            this.resolveSpell(player, card, data.targetId, game);
        }

        this.io.to(player.roomId).emit('cardPlayed', {
            playerId: playerId,
            card: card,
            cardIndex: cardIndex
        });

        this.broadcastGameState(player.roomId);
    }

    attack(playerId, data) {
        const player = this.players.get(playerId);
        if (!player) return;

        const game = this.rooms.get(player.roomId);
        if (!game) return;

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return;

        const attackerCard = player.board[data.attackerIndex];
        if (!attackerCard || !attackerCard.canAttack) return;

        const opponent = game.players.find(p => p.id !== playerId);

        if (data.targetIndex !== undefined && data.targetIndex !== null) {
            // Attack minion
            const targetCard = opponent.board[data.targetIndex];
            if (!targetCard) return;

            // Deal damage
            targetCard.health -= attackerCard.attack;
            attackerCard.health -= targetCard.attack;

            // Remove dead minions
            if (targetCard.health <= 0) {
                opponent.board.splice(data.targetIndex, 1);
            }
            if (attackerCard.health <= 0) {
                player.board.splice(data.attackerIndex, 1);
            }
        } else {
            // Attack player directly
            opponent.health -= attackerCard.attack;

            if (opponent.health <= 0) {
                this.endGame(player.roomId, player.id);
                return;
            }
        }

        attackerCard.canAttack = false;

        this.io.to(player.roomId).emit('attackPerformed', {
            attackerId: playerId,
            attackerIndex: data.attackerIndex,
            targetIndex: data.targetIndex
        });

        this.broadcastGameState(player.roomId);
    }

    resolveSpell(player, card, targetId, game) {
        const opponent = game.players.find(p => p.id !== player.id);

        switch(card.effect) {
            case 'damage':
                if (targetId === 'opponent') {
                    opponent.health -= card.value;
                } else {
                    // Damage to specific minion
                    const target = opponent.board.find(c => c.id === targetId);
                    if (target) {
                        target.health -= card.value;
                        if (target.health <= 0) {
                            opponent.board = opponent.board.filter(c => c.id !== targetId);
                        }
                    }
                }
                break;
            case 'heal':
                player.health = Math.min(player.health + card.value, 30);
                break;
            case 'buff':
                const buffTarget = player.board.find(c => c.id === targetId);
                if (buffTarget) {
                    buffTarget.attack += card.attackBuff || 0;
                    buffTarget.health += card.healthBuff || 0;
                }
                break;
        }
    }

    useAbility(playerId, data) {
        const player = this.players.get(playerId);
        if (!player) return;

        const game = this.rooms.get(player.roomId);
        if (!game) return;

        const card = player.board[data.cardIndex];
        if (!card || !card.ability || card.hasUsedAbility) return;

        // Use ability logic here
        card.hasUsedAbility = true;

        this.broadcastGameState(player.roomId);
    }

    endTurn(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        const game = this.rooms.get(player.roomId);
        if (!game) return;

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return;

        // Switch to next player
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        game.turn++;

        this.io.to(player.roomId).emit('turnEnded', {
            playerId: playerId
        });

        this.startTurn(player.roomId);
    }

    endGame(roomId, winnerId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        game.status = 'finished';

        const winner = this.players.get(winnerId);

        this.io.to(roomId).emit('gameEnd', {
            winnerId: winnerId,
            winnerName: winner.name
        });

        // Cleanup
        setTimeout(() => {
            this.rooms.delete(roomId);
        }, 10000);
    }

    broadcastGameState(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        game.players.forEach(player => {
            const opponent = game.players.find(p => p.id !== player.id);

            player.socket.emit('gameState', {
                you: {
                    health: player.health,
                    mana: player.mana,
                    maxMana: player.maxMana,
                    hand: player.hand,
                    board: player.board,
                    deckSize: player.deck.cards.length
                },
                opponent: {
                    health: opponent.health,
                    mana: opponent.mana,
                    maxMana: opponent.maxMana,
                    handSize: opponent.hand.length,
                    board: opponent.board,
                    deckSize: opponent.deck.cards.length,
                    name: opponent.name
                },
                turn: game.turn,
                isYourTurn: game.players[game.currentPlayerIndex].id === player.id
            });
        });
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        // Remove from waiting list
        this.waitingPlayers = this.waitingPlayers.filter(p => p.id !== playerId);

        // End game if player was in a room
        if (player.roomId) {
            const game = this.rooms.get(player.roomId);
            if (game) {
                const opponent = game.players.find(p => p.id !== playerId);
                if (opponent) {
                    opponent.socket.emit('opponentDisconnected', {
                        message: 'Opponent disconnected. You win!'
                    });
                }
                this.rooms.delete(player.roomId);
            }
        }

        this.players.delete(playerId);
    }
}

module.exports = GameEngine;
