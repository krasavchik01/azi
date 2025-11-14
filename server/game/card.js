class Card {
    constructor(suit, rank) {
        this.id = `${suit}_${rank}`;
        this.suit = suit; // 'hearts', 'diamonds', 'clubs'
        this.rank = rank; // '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'
        this.value = this.getRankValue(rank);
    }

    getRankValue(rank) {
        const values = {
            '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return values[rank];
    }

    toString() {
        return `${this.rank}${this.getSuitSymbol()}`;
    }

    getSuitSymbol() {
        const symbols = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣'
        };
        return symbols[this.suit] || this.suit;
    }

    getSuitColor() {
        return (this.suit === 'hearts' || this.suit === 'diamonds') ? 'red' : 'black';
    }
}

module.exports = Card;
