const Card = require('./card');

class Deck {
    constructor() {
        this.cards = [];
        this.initializeDeck();
        this.shuffle();
    }

    initializeDeck() {
        // 3 масти: черви, бубны, трефы
        const suits = ['hearts', 'diamonds', 'clubs'];
        // Ранги от 6 до туза
        const ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        // Создаем 27 карт (3 масти x 9 рангов)
        for (const suit of suits) {
            for (const rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }

    cardsLeft() {
        return this.cards.length;
    }

    reset() {
        this.cards = [];
        this.initializeDeck();
        this.shuffle();
    }
}

module.exports = Deck;
