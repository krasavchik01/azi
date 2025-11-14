const Deck = require('./deck');

class GameEngine {
    constructor(io) {
        this.io = io;
        this.rooms = new Map();
        this.players = new Map();
        this.waitingRoom = {
            players: [],
            minPlayers: 2,
            maxPlayers: 6
        };
    }

    addPlayer(socket, playerName) {
        const player = {
            id: socket.id,
            name: playerName || `Игрок ${socket.id.substring(0, 4)}`,
            socket: socket,
            money: 100, // Стартовый капитал
            hand: [],
            folded: false,
            tricksWon: 0,
            currentBet: 0,
            hasRaznoMast: false,
            playedNaAzi: false
        };

        this.players.set(socket.id, player);
        this.waitingRoom.players.push(player);

        this.broadcastWaitingRoom();

        // Автостарт при 2+ игроках (можно изменить на требование минимум игроков)
        if (this.waitingRoom.players.length >= this.waitingRoom.minPlayers) {
            socket.emit('canStart', { playerCount: this.waitingRoom.players.length });
        }
    }

    startGame(initiatorId) {
        if (this.waitingRoom.players.length < 2) {
            const player = this.players.get(initiatorId);
            player.socket.emit('error', { message: 'Нужно минимум 2 игрока!' });
            return;
        }

        const roomId = `room_${Date.now()}`;
        const playersInGame = [...this.waitingRoom.players];

        const gameState = {
            id: roomId,
            players: playersInGame,
            activePlayers: playersInGame.map(p => p.id), // Игроки в текущем раунде
            dealerIndex: 0,
            currentPlayerIndex: 0,
            deck: new Deck(),
            trump: null,
            trumpCard: null,
            pot: 0,
            baseBet: 5,
            currentBet: 5,
            bettingRound: 0,
            maxBettingRounds: 3,
            bettingComplete: false,
            phase: 'dealing', // dealing, discarding, betting, playing, gameOver
            currentTrick: [],
            trickLead: null,
            tricksPlayed: 0,
            isReplay: false,
            replayPlayers: [], // Игроки участвующие в переигровке
            naAziPairs: [] // Пары игроков которые играют "на ази"
        };

        this.rooms.set(roomId, gameState);
        this.waitingRoom.players = [];

        // Присоединяем игроков к комнате
        playersInGame.forEach(player => {
            player.roomId = roomId;
            player.socket.join(roomId);
        });

        this.io.to(roomId).emit('gameStart', {
            room: roomId,
            players: playersInGame.map(p => ({
                id: p.id,
                name: p.name,
                money: p.money
            })),
            baseBet: gameState.baseBet
        });

        this.startRound(roomId);
    }

    startRound(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        // Сброс состояния игроков
        game.players.forEach(player => {
            player.hand = [];
            player.folded = false;
            player.tricksWon = 0;
            player.currentBet = 0;
            player.hasRaznoMast = false;
            player.playedNaAzi = false;
        });

        game.phase = 'dealing';
        game.currentTrick = [];
        game.tricksPlayed = 0;
        game.bettingRound = 0;
        game.bettingComplete = false;
        game.currentBet = game.baseBet;

        // Сброс и перемешивание колоды
        game.deck.reset();

        // Определяем сдатчика
        const dealer = game.players[game.dealerIndex];

        this.io.to(roomId).emit('roundStart', {
            dealer: dealer.name,
            pot: game.pot
        });

        // Раздаем по 4 карты
        this.dealCards(roomId);

        // Открываем козырь
        this.revealTrump(roomId);

        // Переходим к фазе сброса карт
        game.phase = 'discarding';
        this.io.to(roomId).emit('phaseChange', { phase: 'discarding' });
    }

    dealCards(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        const playersToDeal = game.isReplay ?
            game.players.filter(p => game.replayPlayers.includes(p.id)) :
            game.players;

        playersToDeal.forEach(player => {
            for (let i = 0; i < 4; i++) {
                const card = game.deck.draw();
                if (card) {
                    player.hand.push(card);
                }
            }
            player.socket.emit('handDealt', { hand: player.hand });
        });
    }

    revealTrump(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        let trumpCard;

        if (game.isReplay && game.replayPlayers.includes(game.players[game.dealerIndex].id)) {
            // Сдатчик участвует - открывает свою последнюю карту
            const dealer = game.players[game.dealerIndex];
            trumpCard = dealer.hand[dealer.hand.length - 1];
        } else if (game.isReplay) {
            // Сдатчик не участвует - открывается верхняя карта колоды
            trumpCard = game.deck.cards[game.deck.cards.length - 1];
        } else {
            // Обычная раздача - последняя карта сдатчика
            const dealer = game.players[game.dealerIndex];
            trumpCard = dealer.hand[dealer.hand.length - 1];
        }

        if (trumpCard) {
            game.trump = trumpCard.suit;
            game.trumpCard = trumpCard;

            this.io.to(roomId).emit('trumpRevealed', {
                trump: game.trump,
                trumpCard: {
                    rank: trumpCard.rank,
                    suit: trumpCard.suit
                }
            });
        }
    }

    playerFold(playerId) {
        const player = this.players.get(playerId);
        if (!player || !player.roomId) return;

        const game = this.rooms.get(player.roomId);
        if (!game || game.phase !== 'discarding') {
            player.socket.emit('error', { message: 'Нельзя сбросить карты сейчас!' });
            return;
        }

        player.folded = true;
        player.hand = [];

        this.io.to(player.roomId).emit('playerFolded', {
            playerId: playerId,
            playerName: player.name
        });

        this.checkAllPlayersDiscarded(player.roomId);
    }

    playerDiscard(playerId, cardIndex) {
        const player = this.players.get(playerId);
        if (!player || !player.roomId) return;

        const game = this.rooms.get(player.roomId);
        if (!game || game.phase !== 'discarding') {
            player.socket.emit('error', { message: 'Нельзя сбросить карту сейчас!' });
            return;
        }

        if (player.folded) {
            player.socket.emit('error', { message: 'Вы уже сбросили карты!' });
            return;
        }

        if (cardIndex < 0 || cardIndex >= player.hand.length) {
            player.socket.emit('error', { message: 'Неверная карта!' });
            return;
        }

        // Сбрасываем одну карту
        player.hand.splice(cardIndex, 1);
        player.socket.emit('cardDiscarded', { hand: player.hand });

        this.checkAllPlayersDiscarded(player.roomId);
    }

    checkAllPlayersDiscarded(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        const allDiscarded = game.players.every(p =>
            p.folded || p.hand.length === 3
        );

        if (allDiscarded) {
            // Переходим к торговле
            game.phase = 'betting';
            game.currentPlayerIndex = (game.dealerIndex + 1) % game.players.length;

            this.io.to(roomId).emit('phaseChange', { phase: 'betting' });
            this.startBetting(roomId);
        }
    }

    startBetting(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        // Все игроки вносят базовую ставку
        game.players.forEach(player => {
            if (!player.folded) {
                player.currentBet = game.baseBet;
                player.money -= game.baseBet;
                game.pot += game.baseBet;
            }
        });

        this.io.to(roomId).emit('bettingStart', {
            pot: game.pot,
            currentBet: game.currentBet
        });

        this.promptNextBet(roomId);
    }

    promptNextBet(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        // Находим следующего активного игрока
        let attempts = 0;
        while (game.players[game.currentPlayerIndex].folded && attempts < game.players.length) {
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
            attempts++;
        }

        const currentPlayer = game.players[game.currentPlayerIndex];

        if (!currentPlayer.folded) {
            currentPlayer.socket.emit('yourTurnToBet', {
                currentBet: game.currentBet,
                pot: game.pot,
                bettingRound: game.bettingRound
            });

            this.io.to(roomId).emit('playerTurnToBet', {
                playerId: currentPlayer.id,
                playerName: currentPlayer.name
            });
        }
    }

    playerBet(playerId, action, raiseAmount = 0) {
        const player = this.players.get(playerId);
        if (!player || !player.roomId) return;

        const game = this.rooms.get(player.roomId);
        if (!game || game.phase !== 'betting') {
            player.socket.emit('error', { message: 'Сейчас не время для ставок!' });
            return;
        }

        if (game.players[game.currentPlayerIndex].id !== playerId) {
            player.socket.emit('error', { message: 'Не ваша очередь!' });
            return;
        }

        if (action === 'fold') {
            player.folded = true;
            this.io.to(player.roomId).emit('playerFoldedBetting', {
                playerId: playerId,
                playerName: player.name
            });
        } else if (action === 'pass') {
            // Пас - игрок не повышает ставку
            this.io.to(player.roomId).emit('playerPassed', {
                playerId: playerId,
                playerName: player.name
            });
        } else if (action === 'raise') {
            if (game.bettingRound >= game.maxBettingRounds) {
                player.socket.emit('error', { message: 'Достигнут лимит повышений!' });
                return;
            }

            const newBet = game.currentBet + raiseAmount;
            player.money -= raiseAmount;
            player.currentBet = newBet;
            game.pot += raiseAmount;
            game.currentBet = newBet;
            game.bettingRound++;

            this.io.to(player.roomId).emit('playerRaised', {
                playerId: playerId,
                playerName: player.name,
                newBet: newBet,
                pot: game.pot
            });
        }

        // Переходим к следующему игроку
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

        // Проверяем, закончена ли торговля
        const activePlayers = game.players.filter(p => !p.folded);
        if (activePlayers.length <= 1 || this.checkBettingComplete(roomId)) {
            this.endBetting(roomId);
        } else {
            this.promptNextBet(roomId);
        }
    }

    checkBettingComplete(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return false;

        // Торговля завершена если все спасовали или достигнут лимит повышений
        return game.bettingRound >= game.maxBettingRounds;
    }

    endBetting(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        game.bettingComplete = true;
        game.phase = 'playing';

        // Определяем первого игрока (справа от победителя торгов)
        // Упрощаем: первым ходит игрок слева от сдатчика
        game.currentPlayerIndex = (game.dealerIndex + 1) % game.players.length;
        game.trickLead = game.currentPlayerIndex;

        this.io.to(roomId).emit('bettingEnded', {
            pot: game.pot,
            startingPlayer: game.players[game.currentPlayerIndex].name
        });

        this.io.to(roomId).emit('phaseChange', { phase: 'playing' });
        this.promptNextPlay(roomId);
    }

    promptNextPlay(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        // Находим следующего активного игрока
        let attempts = 0;
        while (game.players[game.currentPlayerIndex].folded && attempts < game.players.length) {
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
            attempts++;
        }

        const currentPlayer = game.players[game.currentPlayerIndex];

        if (!currentPlayer.folded) {
            currentPlayer.socket.emit('yourTurnToPlay', {
                currentTrick: game.currentTrick,
                trump: game.trump
            });

            this.io.to(roomId).emit('playerTurnToPlay', {
                playerId: currentPlayer.id,
                playerName: currentPlayer.name
            });
        }
    }

    playCard(playerId, cardIndex) {
        const player = this.players.get(playerId);
        if (!player || !player.roomId) return;

        const game = this.rooms.get(player.roomId);
        if (!game || game.phase !== 'playing') {
            player.socket.emit('error', { message: 'Сейчас не время играть карты!' });
            return;
        }

        if (game.players[game.currentPlayerIndex].id !== playerId) {
            player.socket.emit('error', { message: 'Не ваша очередь!' });
            return;
        }

        if (cardIndex < 0 || cardIndex >= player.hand.length) {
            player.socket.emit('error', { message: 'Неверная карта!' });
            return;
        }

        const card = player.hand[cardIndex];

        // Проверка правил игры карты
        if (!this.canPlayCard(player, card, game)) {
            player.socket.emit('error', { message: 'Нельзя сыграть эту карту!' });
            return;
        }

        // Играем карту
        player.hand.splice(cardIndex, 1);
        game.currentTrick.push({
            playerId: playerId,
            playerName: player.name,
            card: card
        });

        this.io.to(player.roomId).emit('cardPlayed', {
            playerId: playerId,
            playerName: player.name,
            card: card,
            currentTrick: game.currentTrick
        });

        player.socket.emit('handUpdated', { hand: player.hand });

        // Проверяем, завершена ли взятка
        const activePlayers = game.players.filter(p => !p.folded);
        if (game.currentTrick.length === activePlayers.length) {
            this.resolveTrick(player.roomId);
        } else {
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
            this.promptNextPlay(player.roomId);
        }
    }

    canPlayCard(player, card, game) {
        if (game.currentTrick.length === 0) {
            // Первый ход - можно играть любую карту
            return true;
        }

        const leadCard = game.currentTrick[0].card;
        const leadSuit = leadCard.suit;

        // Проверяем наличие карт масти хода
        const hasSameSuit = player.hand.some(c => c.suit === leadSuit);

        if (hasSameSuit && card.suit !== leadSuit) {
            // Должен играть карту той же масти
            return false;
        }

        if (!hasSameSuit) {
            // Нет карт масти хода
            const hasTrump = player.hand.some(c => c.suit === game.trump);

            if (hasTrump && card.suit !== game.trump) {
                // Должен бить козырем
                // Исключение: правило "разномасть"
                if (player.hasRaznoMast && card.rank === 'A' && card.suit === game.trump) {
                    // Может не бить козырным тузом при первом ходе в другую масть
                    return true;
                }
                return false;
            }
        }

        return true;
    }

    resolveTrick(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        const leadCard = game.currentTrick[0].card;
        let winningPlay = game.currentTrick[0];

        // Определяем победителя взятки
        for (let i = 1; i < game.currentTrick.length; i++) {
            const play = game.currentTrick[i];

            if (this.cardBeats(play.card, winningPlay.card, leadCard.suit, game.trump)) {
                winningPlay = play;
            }
        }

        const winner = this.players.get(winningPlay.playerId);
        winner.tricksWon++;

        this.io.to(roomId).emit('trickWon', {
            winnerId: winner.id,
            winnerName: winner.name,
            trick: game.currentTrick,
            tricksWon: winner.tricksWon
        });

        game.tricksPlayed++;
        game.currentTrick = [];

        // Проверяем, выиграл ли кто-то игру (2 взятки)
        if (winner.tricksWon >= 2) {
            this.endRound(roomId, winner.id);
        } else if (this.allCardsPlayed(game)) {
            // Все карты сыграны, но никто не взял 2 взятки - АЗИ!
            this.handleAzi(roomId);
        } else {
            // Продолжаем игру, победитель взятки ходит первым
            const winnerIndex = game.players.findIndex(p => p.id === winner.id);
            game.currentPlayerIndex = winnerIndex;
            game.trickLead = winnerIndex;

            setTimeout(() => {
                this.promptNextPlay(roomId);
            }, 2000);
        }
    }

    cardBeats(card, currentWinner, leadSuit, trump) {
        // Козырь бьет некозырную карту
        if (card.suit === trump && currentWinner.suit !== trump) {
            return true;
        }

        // Некозырь не бьет козырь
        if (card.suit !== trump && currentWinner.suit === trump) {
            return false;
        }

        // Обе козыри или обе некозыри той же масти
        if (card.suit === currentWinner.suit) {
            return card.value > currentWinner.value;
        }

        // Карта не той масти и не козырь - не бьет
        return false;
    }

    allCardsPlayed(game) {
        return game.players.every(p => p.folded || p.hand.length === 0);
    }

    endRound(roomId, winnerId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        const winner = this.players.get(winnerId);

        // Проверяем правило "на ази"
        const playedNaAzi = game.naAziPairs.some(pair =>
            pair.includes(winnerId)
        );

        if (playedNaAzi) {
            this.io.to(roomId).emit('naAziTriggered', {
                winnerId: winnerId,
                winnerName: winner.name
            });
            // Игрок участвует в переигровке как взявший одну взятку
            this.handleAzi(roomId);
            return;
        }

        // Обычная победа
        winner.money += game.pot;

        this.io.to(roomId).emit('roundEnd', {
            winnerId: winnerId,
            winnerName: winner.name,
            pot: game.pot,
            winnerMoney: winner.money
        });

        // Сброс состояния
        game.pot = 0;
        game.dealerIndex = (game.dealerIndex + 1) % game.players.length;

        // Начинаем новый раунд
        setTimeout(() => {
            this.startRound(roomId);
        }, 5000);
    }

    handleAzi(roomId) {
        const game = this.rooms.get(roomId);
        if (!game) return;

        // Определяем игроков для переигровки
        const playersWithOneTrick = game.players.filter(p => p.tricksWon === 1);
        const playersWithZeroTricks = game.players.filter(p => p.tricksWon === 0 && !p.folded);

        this.io.to(roomId).emit('aziOccurred', {
            playersWithOneTrick: playersWithOneTrick.map(p => ({ id: p.id, name: p.name })),
            pot: game.pot
        });

        // Игроки с 1 взяткой играют бесплатно
        // Игроки с 0 взяток платят половину кона
        playersWithZeroTricks.forEach(player => {
            const halfPot = Math.floor(game.baseBet / 2);
            player.money -= halfPot;
            game.pot += halfPot;
        });

        game.isReplay = true;
        game.replayPlayers = playersWithOneTrick.map(p => p.id);

        // Переигровка
        setTimeout(() => {
            this.startRound(roomId);
        }, 5000);
    }

    declareRaznoMast(playerId) {
        const player = this.players.get(playerId);
        if (!player || !player.roomId) return;

        const game = this.rooms.get(player.roomId);
        if (!game) return;

        // Проверяем условия: козырный туз + 2 карты одной масти
        const hasTrumpAce = player.hand.some(c => c.rank === 'A' && c.suit === game.trump);

        if (!hasTrumpAce) {
            player.socket.emit('error', { message: 'Нет козырного туза!' });
            return;
        }

        // Проверяем наличие двух карт одной масти
        const suitCounts = {};
        player.hand.forEach(card => {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        });

        const hasTwoOfSameSuit = Object.values(suitCounts).some(count => count >= 2);

        if (!hasTwoOfSameSuit) {
            player.socket.emit('error', { message: 'Нет двух карт одной масти!' });
            return;
        }

        player.hasRaznoMast = true;

        this.io.to(player.roomId).emit('raznoMastDeclared', {
            playerId: playerId,
            playerName: player.name
        });
    }

    proposeNaAzi(playerId, targetPlayerId) {
        const player = this.players.get(playerId);
        const targetPlayer = this.players.get(targetPlayerId);

        if (!player || !targetPlayer || player.roomId !== targetPlayer.roomId) return;

        const game = this.rooms.get(player.roomId);
        if (!game) return;

        // Отправляем предложение целевому игроку
        targetPlayer.socket.emit('naAziProposal', {
            fromId: playerId,
            fromName: player.name
        });
    }

    acceptNaAzi(playerId, proposerId) {
        const player = this.players.get(playerId);
        const proposer = this.players.get(proposerId);

        if (!player || !proposer || player.roomId !== proposer.roomId) return;

        const game = this.rooms.get(player.roomId);
        if (!game) return;

        // Добавляем пару в список "на ази"
        game.naAziPairs.push([playerId, proposerId]);

        player.playedNaAzi = true;
        proposer.playedNaAzi = true;

        this.io.to(player.roomId).emit('naAziAccepted', {
            player1: player.name,
            player2: proposer.name
        });
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        // Удаляем из комнаты ожидания
        this.waitingRoom.players = this.waitingRoom.players.filter(p => p.id !== playerId);
        this.broadcastWaitingRoom();

        // Обработка выхода из активной игры
        if (player.roomId) {
            const game = this.rooms.get(player.roomId);
            if (game) {
                this.io.to(player.roomId).emit('playerLeft', {
                    playerId: playerId,
                    playerName: player.name
                });

                // Можно добавить логику завершения игры при выходе игрока
            }
        }

        this.players.delete(playerId);
    }

    broadcastWaitingRoom() {
        this.waitingRoom.players.forEach(player => {
            player.socket.emit('waitingRoomUpdate', {
                players: this.waitingRoom.players.map(p => ({ id: p.id, name: p.name, money: p.money })),
                count: this.waitingRoom.players.length,
                minPlayers: this.waitingRoom.minPlayers,
                maxPlayers: this.waitingRoom.maxPlayers
            });
        });
    }
}

module.exports = GameEngine;
