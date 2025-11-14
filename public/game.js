class AZIGame {
    constructor() {
        this.socket = io();
        this.playerName = '';
        this.myId = null;
        this.gameState = {
            players: [],
            trump: null,
            pot: 0,
            phase: '',
            currentPlayerId: null
        };
        this.myHand = [];
        this.myMoney = 100;
        this.currentTrick = [];
        this.selectedCardIndex = null;

        this.setupEventListeners();
        this.setupSocketListeners();
    }

    setupEventListeners() {
        // Join button
        document.getElementById('joinButton').addEventListener('click', () => {
            const name = document.getElementById('playerName').value.trim();
            if (name) {
                this.playerName = name;
                this.joinWaitingRoom();
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

        // Start game button
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.socket.emit('startGame');
        });

        // Action buttons
        document.getElementById('foldBtn').addEventListener('click', () => {
            this.socket.emit('fold');
        });

        document.getElementById('passBtn').addEventListener('click', () => {
            this.socket.emit('bet', { action: 'pass' });
        });

        document.getElementById('raiseBtn').addEventListener('click', () => {
            const amount = parseInt(document.getElementById('raiseAmount').value) || 5;
            this.socket.emit('bet', { action: 'raise', raiseAmount: amount });
        });

        document.getElementById('raznoMastBtn').addEventListener('click', () => {
            this.socket.emit('declareRaznoMast');
        });
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.myId = this.socket.id;
        });

        this.socket.on('waitingRoomUpdate', (data) => {
            this.updateWaitingRoom(data);
        });

        this.socket.on('canStart', (data) => {
            document.getElementById('startGameBtn').disabled = false;
        });

        this.socket.on('gameStart', (data) => {
            this.log('Игра началась!', true);
            this.gameState.players = data.players;
            this.showScreen('gameScreen');
        });

        this.socket.on('roundStart', (data) => {
            this.log(`Новый раунд! Сдает: ${data.dealer}`, true);
            this.updatePot(data.pot);
        });

        this.socket.on('handDealt', (data) => {
            this.myHand = data.hand;
            this.renderHand();
            this.log('Вам раздали карты');
        });

        this.socket.on('trumpRevealed', (data) => {
            this.gameState.trump = data.trump;
            this.updateTrump(data.trumpCard);
            this.log(`Козырь: ${this.getCardString(data.trumpCard)}`, true);
        });

        this.socket.on('phaseChange', (data) => {
            this.gameState.phase = data.phase;
            this.updatePhase(data.phase);
            this.updateActionButtons();
        });

        this.socket.on('playerFolded', (data) => {
            this.log(`${data.playerName} сбросил карты`);
        });

        this.socket.on('cardDiscarded', (data) => {
            this.myHand = data.hand;
            this.renderHand();
            this.log('Вы сбросили карту');
        });

        this.socket.on('bettingStart', (data) => {
            this.updatePot(data.pot);
            this.log('Торговля началась!', true);
        });

        this.socket.on('yourTurnToBet', (data) => {
            this.log('Ваш ход делать ставку!', true);
            this.showBettingButtons(data);
        });

        this.socket.on('playerTurnToBet', (data) => {
            this.gameState.currentPlayerId = data.playerId;
            this.log(`${data.playerName} делает ставку...`);
            this.updateCurrentPlayer();
        });

        this.socket.on('playerPassed', (data) => {
            this.log(`${data.playerName} спасовал`);
        });

        this.socket.on('playerRaised', (data) => {
            this.updatePot(data.pot);
            this.log(`${data.playerName} повысил до ${data.newBet}₽`, true);
        });

        this.socket.on('playerFoldedBetting', (data) => {
            this.log(`${data.playerName} вышел из торговли`);
        });

        this.socket.on('bettingEnded', (data) => {
            this.updatePot(data.pot);
            this.log(`Торговля завершена! Первым ходит: ${data.startingPlayer}`, true);
        });

        this.socket.on('yourTurnToPlay', (data) => {
            this.log('Ваш ход играть карту!', true);
            this.enableCardSelection();
        });

        this.socket.on('playerTurnToPlay', (data) => {
            this.gameState.currentPlayerId = data.playerId;
            this.log(`${data.playerName} ходит...`);
            this.updateCurrentPlayer();
        });

        this.socket.on('cardPlayed', (data) => {
            this.log(`${data.playerName} сыграл ${this.getCardString(data.card)}`);
            this.currentTrick = data.currentTrick;
            this.renderCurrentTrick();
        });

        this.socket.on('handUpdated', (data) => {
            this.myHand = data.hand;
            this.renderHand();
        });

        this.socket.on('trickWon', (data) => {
            this.log(`${data.winnerName} взял взятку! (Всего: ${data.tricksWon})`, true);
            setTimeout(() => {
                this.currentTrick = [];
                this.renderCurrentTrick();
            }, 2000);
        });

        this.socket.on('roundEnd', (data) => {
            this.log(`${data.winnerName} выиграл раунд и получил ${data.pot}₽!`, true);
            if (data.winnerId === this.myId) {
                this.myMoney = data.winnerMoney;
                this.updateMoney();
            }
        });

        this.socket.on('aziOccurred', (data) => {
            this.log('АЗИ! Никто не взял 2 взятки. Переигровка!', true);
            this.updatePot(data.pot);
        });

        this.socket.on('naAziTriggered', (data) => {
            this.log(`${data.winnerName} сыграл "на ази" - участвует в переигровке!`);
        });

        this.socket.on('raznoMastDeclared', (data) => {
            this.log(`${data.playerName} объявил "Разномасть"!`, true);
        });

        this.socket.on('naAziProposal', (data) => {
            if (confirm(`${data.fromName} предлагает сыграть "на ази". Принять?`)) {
                this.socket.emit('acceptNaAzi', data.fromId);
            }
        });

        this.socket.on('naAziAccepted', (data) => {
            this.log(`${data.player1} и ${data.player2} играют "на ази"!`, true);
        });

        this.socket.on('playerLeft', (data) => {
            this.log(`${data.playerName} покинул игру`);
        });

        this.socket.on('error', (data) => {
            alert(data.message);
            this.log(`Ошибка: ${data.message}`);
        });
    }

    joinWaitingRoom() {
        this.socket.emit('joinWaitingRoom', this.playerName);
        this.showScreen('waitingScreen');
    }

    updateWaitingRoom(data) {
        const playersList = document.getElementById('playersList');
        const playersCount = document.getElementById('playersCount');

        playersCount.textContent = data.count;

        playersList.innerHTML = '';
        data.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <span>${player.name}</span>
                <span>${player.money}₽</span>
            `;
            playersList.appendChild(playerItem);
        });

        if (data.count >= data.minPlayers) {
            document.getElementById('startGameBtn').disabled = false;
        }
    }

    renderHand() {
        const handEl = document.getElementById('playerHand');
        handEl.innerHTML = '';

        this.myHand.forEach((card, index) => {
            const cardEl = this.createCardElement(card);
            cardEl.addEventListener('click', () => this.onCardClick(index));

            if (this.selectedCardIndex === index) {
                cardEl.classList.add('selected');
            }

            handEl.appendChild(cardEl);
        });
    }

    createCardElement(card) {
        const cardEl = document.createElement('div');
        const color = card.getSuitColor();
        cardEl.className = `card ${color}`;

        const rankTop = document.createElement('div');
        rankTop.className = 'rank-top';
        rankTop.textContent = card.rank + card.getSuitSymbol();

        const suitCenter = document.createElement('div');
        suitCenter.className = 'suit-center';
        suitCenter.textContent = card.getSuitSymbol();

        const rankBottom = document.createElement('div');
        rankBottom.className = 'rank-bottom';
        rankBottom.textContent = card.rank + card.getSuitSymbol();

        cardEl.appendChild(rankTop);
        cardEl.appendChild(suitCenter);
        cardEl.appendChild(rankBottom);

        return cardEl;
    }

    onCardClick(index) {
        if (this.gameState.phase === 'discarding') {
            // Discard this card
            this.socket.emit('discardCard', index);
        } else if (this.gameState.phase === 'playing' && this.gameState.currentPlayerId === this.myId) {
            // Play this card
            this.socket.emit('playCard', index);
            this.selectedCardIndex = null;
        } else {
            // Just select
            this.selectedCardIndex = index;
            this.renderHand();
        }
    }

    renderCurrentTrick() {
        const trickEl = document.getElementById('currentTrick');
        trickEl.innerHTML = '';

        this.currentTrick.forEach(play => {
            const trickCard = document.createElement('div');
            trickCard.className = 'trick-card';

            const label = document.createElement('div');
            label.className = 'player-label';
            label.textContent = play.playerName;

            const cardEl = this.createCardElement(play.card);
            cardEl.style.cursor = 'default';

            trickCard.appendChild(label);
            trickCard.appendChild(cardEl);
            trickEl.appendChild(trickCard);
        });
    }

    updateTrump(trumpCard) {
        const trumpDisplay = document.getElementById('trumpDisplay');
        trumpDisplay.textContent = this.getCardString(trumpCard);
    }

    updatePot(pot) {
        this.gameState.pot = pot;
        document.getElementById('potDisplay').textContent = pot + '₽';
    }

    updateMoney() {
        document.getElementById('moneyDisplay').textContent = this.myMoney + '₽';
    }

    updatePhase(phase) {
        const phaseNames = {
            'dealing': 'Раздача',
            'discarding': 'Сброс карты',
            'betting': 'Торговля',
            'playing': 'Розыгрыш'
        };
        document.getElementById('phaseDisplay').textContent = phaseNames[phase] || phase;
    }

    updateActionButtons() {
        // Hide all buttons
        document.getElementById('foldBtn').style.display = 'none';
        document.getElementById('passBtn').style.display = 'none';
        document.getElementById('raiseBtn').style.display = 'none';
        document.getElementById('raiseAmount').style.display = 'none';
        document.getElementById('raznoMastBtn').style.display = 'none';

        if (this.gameState.phase === 'discarding') {
            document.getElementById('foldBtn').style.display = 'inline-block';
        }
    }

    showBettingButtons(data) {
        document.getElementById('passBtn').style.display = 'inline-block';

        if (data.bettingRound < 3) {
            document.getElementById('raiseBtn').style.display = 'inline-block';
            document.getElementById('raiseAmount').style.display = 'inline-block';
        }

        document.getElementById('foldBtn').style.display = 'inline-block';
    }

    enableCardSelection() {
        // Cards are already clickable
    }

    updateCurrentPlayer() {
        const otherPlayers = document.getElementById('otherPlayers');
        otherPlayers.innerHTML = '';

        this.gameState.players.forEach(player => {
            if (player.id !== this.myId) {
                const playerBox = document.createElement('div');
                playerBox.className = 'player-box';

                if (player.id === this.gameState.currentPlayerId) {
                    playerBox.classList.add('active');
                }

                playerBox.innerHTML = `
                    <div class="name">${player.name}</div>
                    <div class="money">${player.money}₽</div>
                `;

                otherPlayers.appendChild(playerBox);
            }
        });
    }

    getCardString(card) {
        return card.rank + this.getSuitSymbol(card.suit);
    }

    getSuitSymbol(suit) {
        const symbols = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣'
        };
        return symbols[suit] || suit;
    }

    log(message, important = false) {
        const logEl = document.getElementById('gameLog');
        const entry = document.createElement('div');
        entry.className = 'log-entry' + (important ? ' important' : '');
        entry.textContent = `• ${message}`;
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;

        // Keep only last 20 messages
        while (logEl.children.length > 20) {
            logEl.removeChild(logEl.firstChild);
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

// Start game
const game = new AZIGame();
