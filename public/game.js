class AZIGame {
    constructor() {
        this.socket = io();
        this.playerName = '';
        this.gameState = null;
        this.selectedCard = null;
        this.selectedBoardCard = null;
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    setupEventListeners() {
        // Login
        document.getElementById('joinButton').addEventListener('click', () => {
            const name = document.getElementById('playerName').value.trim();
            if (name) {
                this.playerName = name;
                this.joinGame();
            } else {
                alert('Пожалуйста, введите ваше имя!');
            }
        });

        // Enter key on name input
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('joinButton').click();
            }
        });

        // End turn
        document.getElementById('endTurnBtn').addEventListener('click', () => {
            this.socket.emit('endTurn');
        });

        // Play again
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            location.reload();
        });
    }

    setupSocketListeners() {
        this.socket.on('waiting', (data) => {
            this.showScreen('waitingScreen');
            this.log('Ожидание противника...');
        });

        this.socket.on('gameStart', (data) => {
            this.log('Игра началась! Удачи!');
            this.showScreen('gameScreen');
            const opponent = data.players.find(p => p.id !== this.socket.id);
            document.querySelector('.opponent-area .player-name').textContent = opponent.name;
        });

        this.socket.on('gameState', (state) => {
            this.gameState = state;
            this.updateUI();
        });

        this.socket.on('turnStart', (data) => {
            if (data.currentPlayerId === this.socket.id) {
                this.log(`Ваш ход! Ход ${data.turn}`);
                this.updateTurnIndicator(true);
            } else {
                this.log(`Ход противника: ${data.playerName}`);
                this.updateTurnIndicator(false);
            }
        });

        this.socket.on('cardPlayed', (data) => {
            const isYou = data.playerId === this.socket.id;
            this.log(`${isYou ? 'Вы' : 'Противник'} сыграли карту: ${data.card.name}`);
            this.playCardAnimation();
        });

        this.socket.on('attackPerformed', (data) => {
            const isYou = data.attackerId === this.socket.id;
            this.log(`${isYou ? 'Вы' : 'Противник'} атаковали!`);
            this.playAttackAnimation();
        });

        this.socket.on('turnEnded', (data) => {
            const isYou = data.playerId === this.socket.id;
            this.log(`${isYou ? 'Вы' : 'Противник'} закончили ход`);
        });

        this.socket.on('gameEnd', (data) => {
            const isWinner = data.winnerId === this.socket.id;
            this.showEndScreen(isWinner, data.winnerName);
        });

        this.socket.on('opponentDisconnected', (data) => {
            alert(data.message);
            this.showEndScreen(true, 'Вы');
        });

        this.socket.on('error', (data) => {
            this.log(`❌ ${data.message}`);
            this.shake();
        });

        this.socket.on('updateHand', (data) => {
            // Hand is updated via gameState
        });
    }

    joinGame() {
        this.socket.emit('joinGame', this.playerName);
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    updateUI() {
        if (!this.gameState) return;

        // Update player stats
        document.getElementById('playerHealth').textContent = this.gameState.you.health;
        document.getElementById('playerMana').textContent = this.gameState.you.mana;
        document.getElementById('playerMaxMana').textContent = this.gameState.you.maxMana;
        document.getElementById('playerDeck').textContent = this.gameState.you.deckSize;

        // Update opponent stats
        document.getElementById('opponentHealth').textContent = this.gameState.opponent.health;
        document.getElementById('opponentMana').textContent = this.gameState.opponent.mana;
        document.getElementById('opponentMaxMana').textContent = this.gameState.opponent.maxMana;
        document.getElementById('opponentDeck').textContent = this.gameState.opponent.deckSize;

        // Update hand
        this.renderHand();

        // Update boards
        this.renderBoard('playerBoard', this.gameState.you.board, true);
        this.renderBoard('opponentBoard', this.gameState.opponent.board, false);

        // Update opponent hand count
        this.renderOpponentHand(this.gameState.opponent.handSize);

        // Update end turn button
        const endTurnBtn = document.getElementById('endTurnBtn');
        endTurnBtn.disabled = !this.gameState.isYourTurn;
    }

    renderHand() {
        const handEl = document.getElementById('playerHand');
        handEl.innerHTML = '';

        this.gameState.you.hand.forEach((card, index) => {
            const cardEl = this.createCardElement(card, true);
            cardEl.addEventListener('click', () => {
                if (this.gameState.isYourTurn) {
                    this.playCard(index, card);
                }
            });
            handEl.appendChild(cardEl);
        });
    }

    renderBoard(boardId, cards, isPlayer) {
        const boardEl = document.getElementById(boardId);
        boardEl.innerHTML = '';

        cards.forEach((card, index) => {
            const cardEl = this.createCardElement(card, false);

            if (isPlayer && this.gameState.isYourTurn && card.canAttack) {
                cardEl.classList.add('can-attack');
                cardEl.addEventListener('click', () => {
                    this.selectBoardCard(index, card);
                });
            }

            if (!isPlayer && this.selectedBoardCard !== null) {
                cardEl.addEventListener('click', () => {
                    this.attackTarget(index);
                });
                cardEl.style.cursor = 'crosshair';
            }

            boardEl.appendChild(cardEl);
        });

        // Allow attacking opponent directly
        if (isPlayer === false && this.selectedBoardCard !== null) {
            boardEl.style.cursor = 'crosshair';
            boardEl.addEventListener('click', (e) => {
                if (e.target === boardEl) {
                    this.attackTarget(null);
                }
            });
        }
    }

    renderOpponentHand(count) {
        const handEl = document.querySelector('.opponent-hand .card-back-container');
        handEl.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardBack.textContent = '🎴';
            handEl.appendChild(cardBack);
        }
    }

    createCardElement(card, isInHand) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.element} ${card.rarity}`;

        if (isInHand) {
            cardEl.classList.add('card-draw-animation');
        }

        const costEl = document.createElement('div');
        costEl.className = 'card-cost';
        costEl.textContent = card.cost;

        const nameEl = document.createElement('div');
        nameEl.className = 'card-name';
        nameEl.textContent = card.name;

        const imageEl = document.createElement('div');
        imageEl.className = 'card-image';
        imageEl.textContent = this.getElementEmoji(card.element);

        cardEl.appendChild(costEl);
        cardEl.appendChild(nameEl);
        cardEl.appendChild(imageEl);

        if (card.type === 'minion') {
            const statsEl = document.createElement('div');
            statsEl.className = 'card-stats';

            const attackEl = document.createElement('div');
            attackEl.className = 'card-attack';
            attackEl.textContent = `⚔️ ${card.attack}`;

            const healthEl = document.createElement('div');
            healthEl.className = 'card-health';
            healthEl.textContent = `❤️ ${card.health}`;

            statsEl.appendChild(attackEl);
            statsEl.appendChild(healthEl);
            cardEl.appendChild(statsEl);
        } else {
            const typeEl = document.createElement('div');
            typeEl.className = 'card-type';
            typeEl.textContent = '✨ Заклинание';
            cardEl.appendChild(typeEl);
        }

        const descEl = document.createElement('div');
        descEl.className = 'card-description';
        descEl.textContent = card.description;
        cardEl.appendChild(descEl);

        return cardEl;
    }

    getElementEmoji(element) {
        const emojis = {
            'fire': '🔥',
            'water': '💧',
            'earth': '🌍',
            'air': '💨'
        };
        return emojis[element] || '⭐';
    }

    playCard(cardIndex, card) {
        if (this.gameState.you.mana < card.cost) {
            this.log('❌ Недостаточно маны!');
            this.shake();
            return;
        }

        if (card.type === 'spell') {
            // For now, spells target opponent
            this.socket.emit('playCard', {
                cardIndex: cardIndex,
                targetId: 'opponent'
            });
        } else {
            this.socket.emit('playCard', {
                cardIndex: cardIndex
            });
        }
    }

    selectBoardCard(index, card) {
        this.selectedBoardCard = index;
        this.log(`Выбрана карта: ${card.name}. Выберите цель атаки.`);
        this.updateUI(); // Re-render to show attack targets
    }

    attackTarget(targetIndex) {
        if (this.selectedBoardCard === null) return;

        this.socket.emit('attack', {
            attackerIndex: this.selectedBoardCard,
            targetIndex: targetIndex
        });

        this.selectedBoardCard = null;
        this.updateUI();
    }

    updateTurnIndicator(isYourTurn) {
        const indicator = document.getElementById('turnIndicator');
        if (isYourTurn) {
            indicator.textContent = '⚡ ВАШ ХОД!';
            indicator.classList.remove('opponent-turn');
        } else {
            indicator.textContent = '⏳ Ход противника...';
            indicator.classList.add('opponent-turn');
        }
    }

    log(message) {
        const logEl = document.getElementById('logMessages');
        const msgEl = document.createElement('div');
        msgEl.textContent = `• ${message}`;
        logEl.appendChild(msgEl);
        logEl.scrollTop = logEl.scrollHeight;

        // Keep only last 5 messages
        while (logEl.children.length > 5) {
            logEl.removeChild(logEl.firstChild);
        }
    }

    showEndScreen(isWinner, winnerName) {
        const resultEl = document.getElementById('endResult');
        const messageEl = document.getElementById('endMessage');

        if (isWinner) {
            resultEl.textContent = '🎉 ПОБЕДА! 🎉';
            resultEl.style.color = '#4ecdc4';
            messageEl.textContent = `Поздравляем, ${winnerName}! Вы одержали победу!`;
        } else {
            resultEl.textContent = '💔 ПОРАЖЕНИЕ 💔';
            resultEl.style.color = '#ff6b6b';
            messageEl.textContent = `Победил ${winnerName}. Попробуйте еще раз!`;
        }

        setTimeout(() => {
            this.showScreen('endScreen');
        }, 2000);
    }

    playCardAnimation() {
        // Visual feedback
        document.body.style.animation = 'none';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 10);
    }

    playAttackAnimation() {
        // Simple screen shake
        document.body.style.animation = 'shake 0.5s';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 500);
    }

    shake() {
        document.body.style.animation = 'shake 0.3s';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 300);
    }
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Start game
const game = new AZIGame();
