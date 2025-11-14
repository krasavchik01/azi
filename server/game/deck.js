const Card = require('./card');

class Deck {
    constructor() {
        this.cards = [];
        this.initializeDeck();
        this.shuffle();
    }

    initializeDeck() {
        // Fire Cards - Агрессивные, наносят урон
        this.cards.push(new Card({
            name: 'Огненный Элементаль',
            type: 'minion',
            element: 'fire',
            cost: 3,
            attack: 3,
            health: 2,
            rarity: 'common',
            description: 'Быстрая атака'
        }));

        this.cards.push(new Card({
            name: 'Феникс',
            type: 'minion',
            element: 'fire',
            cost: 5,
            attack: 5,
            health: 4,
            rarity: 'epic',
            ability: 'rebirth',
            description: 'Воскрешается с 1 HP'
        }));

        this.cards.push(new Card({
            name: 'Огненный Шар',
            type: 'spell',
            element: 'fire',
            cost: 4,
            effect: 'damage',
            value: 5,
            rarity: 'common',
            description: 'Наносит 5 урона'
        }));

        this.cards.push(new Card({
            name: 'Дракон Пламени',
            type: 'minion',
            element: 'fire',
            cost: 8,
            attack: 8,
            health: 8,
            rarity: 'legendary',
            description: 'Легендарный дракон'
        }));

        // Water Cards - Контроль и защита
        this.cards.push(new Card({
            name: 'Водный Страж',
            type: 'minion',
            element: 'water',
            cost: 2,
            attack: 1,
            health: 4,
            rarity: 'common',
            description: 'Высокая защита'
        }));

        this.cards.push(new Card({
            name: 'Морской Целитель',
            type: 'minion',
            element: 'water',
            cost: 4,
            attack: 2,
            health: 5,
            rarity: 'rare',
            ability: 'heal',
            description: 'Лечит владельца'
        }));

        this.cards.push(new Card({
            name: 'Волна Исцеления',
            type: 'spell',
            element: 'water',
            cost: 3,
            effect: 'heal',
            value: 6,
            rarity: 'common',
            description: 'Восстанавливает 6 HP'
        }));

        this.cards.push(new Card({
            name: 'Левиафан',
            type: 'minion',
            element: 'water',
            cost: 7,
            attack: 6,
            health: 9,
            rarity: 'legendary',
            description: 'Морское чудовище'
        }));

        // Earth Cards - Выносливость и сила
        this.cards.push(new Card({
            name: 'Каменный Голем',
            type: 'minion',
            element: 'earth',
            cost: 4,
            attack: 3,
            health: 6,
            rarity: 'common',
            description: 'Крепкий как камень'
        }));

        this.cards.push(new Card({
            name: 'Древень',
            type: 'minion',
            element: 'earth',
            cost: 5,
            attack: 4,
            health: 5,
            rarity: 'rare',
            description: 'Древний страж леса'
        }));

        this.cards.push(new Card({
            name: 'Укрепление',
            type: 'spell',
            element: 'earth',
            cost: 2,
            effect: 'buff',
            attackBuff: 2,
            healthBuff: 2,
            rarity: 'common',
            description: '+2/+2 к существу'
        }));

        this.cards.push(new Card({
            name: 'Титан Земли',
            type: 'minion',
            element: 'earth',
            cost: 9,
            attack: 7,
            health: 10,
            rarity: 'legendary',
            description: 'Непоколебимый титан'
        }));

        // Air Cards - Скорость и магия
        this.cards.push(new Card({
            name: 'Воздушный Дух',
            type: 'minion',
            element: 'air',
            cost: 2,
            attack: 2,
            health: 2,
            rarity: 'common',
            description: 'Быстрый и ловкий'
        }));

        this.cards.push(new Card({
            name: 'Гроза',
            type: 'minion',
            element: 'air',
            cost: 6,
            attack: 6,
            health: 4,
            rarity: 'epic',
            ability: 'storm',
            description: 'Призывает молнии'
        }));

        this.cards.push(new Card({
            name: 'Удар Молнии',
            type: 'spell',
            element: 'air',
            cost: 1,
            effect: 'damage',
            value: 3,
            rarity: 'common',
            description: 'Быстрый урон'
        }));

        this.cards.push(new Card({
            name: 'Повелитель Бури',
            type: 'minion',
            element: 'air',
            cost: 7,
            attack: 7,
            health: 6,
            rarity: 'legendary',
            description: 'Владыка ветров'
        }));

        // Additional cards for variety
        for (let i = 0; i < 4; i++) {
            this.cards.push(new Card({
                name: 'Огненный Страж',
                type: 'minion',
                element: 'fire',
                cost: 2,
                attack: 2,
                health: 1,
                rarity: 'common',
                description: 'Быстрая атака'
            }));

            this.cards.push(new Card({
                name: 'Водный Маг',
                type: 'minion',
                element: 'water',
                cost: 3,
                attack: 2,
                health: 3,
                rarity: 'common',
                description: 'Базовый маг'
            }));

            this.cards.push(new Card({
                name: 'Земляной Воин',
                type: 'minion',
                element: 'earth',
                cost: 3,
                attack: 3,
                health: 3,
                rarity: 'common',
                description: 'Сбалансированный боец'
            }));

            this.cards.push(new Card({
                name: 'Воздушный Рейнджер',
                type: 'minion',
                element: 'air',
                cost: 4,
                attack: 4,
                health: 2,
                rarity: 'common',
                description: 'Высокий урон'
            }));
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
}

module.exports = Deck;
