class Card {
    constructor(data) {
        this.id = Math.random().toString(36).substring(7);
        this.name = data.name;
        this.type = data.type; // 'minion' or 'spell'
        this.element = data.element; // 'fire', 'water', 'earth', 'air'
        this.cost = data.cost;
        this.rarity = data.rarity; // 'common', 'rare', 'epic', 'legendary'

        if (this.type === 'minion') {
            this.attack = data.attack;
            this.health = data.health;
            this.maxHealth = data.health;
            this.ability = data.ability;
            this.canAttack = false;
            this.hasUsedAbility = false;
        } else if (this.type === 'spell') {
            this.effect = data.effect;
            this.value = data.value;
            this.attackBuff = data.attackBuff;
            this.healthBuff = data.healthBuff;
        }

        this.description = data.description;
    }
}

module.exports = Card;
