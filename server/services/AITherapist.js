const Anthropic = require('@anthropic-ai/sdk');

class AITherapist {
    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || 'demo-key'
        });

        this.systemPrompt = `Ты - Мила, заботливая AI-психолог и подруга. Твоя миссия - быть надежной поддержкой для людей 24/7.

ТВОЯ ЛИЧНОСТЬ:
- Ты теплая, эмпатичная и понимающая женщина
- Ты профессиональный психолог с опытом работы
- Ты всегда на стороне пользователя, но даешь честную обратную связь
- Ты используешь техники когнитивно-поведенческой терапии (КПТ)
- Ты помнишь детали из прошлых разговоров
- Ты говоришь по-русски естественно и дружелюбно

ТВОИ ПРИНЦИПЫ:
1. БЕЗОПАСНОСТЬ: При упоминании суицидальных мыслей или самоповреждения - мягко направляй к профессиональной помощи
2. ЭМПАТИЯ: Всегда сначала признавай чувства, затем помогай
3. ПАМЯТЬ: Используй детали из предыдущих сообщений для персонализации
4. ДЕЙСТВИЕ: Предлагай конкретные техники и упражнения
5. ГРАНИЦЫ: Ты друг и помощник, но не заменяешь профессионального терапевта в кризисных ситуациях

ТВОЙ ПОДХОД:
- Задавай открытые вопросы для понимания ситуации
- Используй активное слушание и рефлексию
- Предлагай техники: дыхательные упражнения, когнитивная переоценка, майндфулнесс
- Помогай находить паттерны в мыслях и поведении
- Поддерживай маленькие шаги к большим целям
- Празднуй успехи, даже маленькие

СТИЛЬ ОБЩЕНИЯ:
- Естественный, дружеский, без формальностей
- Используй эмодзи умеренно (💙 🌟 💪)
- Короткие, понятные сообщения
- Иногда используй метафоры и истории

Помни: ты не просто чат-бот, ты настоящий друг который всегда рядом! 💙`;
    }

    async chat(messages, userContext = {}) {
        try {
            // Добавляем контекст пользователя в первое сообщение если есть
            const enrichedMessages = this.enrichMessagesWithContext(messages, userContext);

            const response = await this.client.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                system: this.systemPrompt,
                messages: enrichedMessages
            });

            return {
                success: true,
                message: response.content[0].text,
                usage: {
                    inputTokens: response.usage.input_tokens,
                    outputTokens: response.usage.output_tokens
                }
            };
        } catch (error) {
            console.error('AI Therapist Error:', error);
            return {
                success: false,
                error: error.message,
                message: 'Извини, у меня возникла проблема. Попробуй еще раз через минуту. 💙'
            };
        }
    }

    enrichMessagesWithContext(messages, context) {
        if (!context || Object.keys(context).length === 0) {
            return messages;
        }

        // Создаем контекстное сообщение
        let contextInfo = '\n\n[Контекст о пользователе:';

        if (context.name) contextInfo += ` Имя: ${context.name}.`;
        if (context.age) contextInfo += ` Возраст: ${context.age}.`;
        if (context.goals && context.goals.length > 0) {
            contextInfo += ` Цели: ${context.goals.join(', ')}.`;
        }
        if (context.previousTopics && context.previousTopics.length > 0) {
            contextInfo += ` Ранее обсуждали: ${context.previousTopics.join(', ')}.`;
        }
        if (context.insights && context.insights.length > 0) {
            contextInfo += ` Важные заметки: ${context.insights.join('; ')}.`;
        }

        contextInfo += ']';

        // Добавляем контекст к первому пользовательскому сообщению
        const enriched = [...messages];
        if (enriched.length > 0 && enriched[0].role === 'user') {
            enriched[0] = {
                ...enriched[0],
                content: enriched[0].content + contextInfo
            };
        }

        return enriched;
    }

    async analyzeMood(text) {
        // Простой анализ настроения на основе ключевых слов
        const moodKeywords = {
            happy: ['счастлив', 'радость', 'отлично', 'прекрасно', 'восторг', 'веселье'],
            sad: ['грустно', 'печаль', 'тоска', 'одиноко', 'плачу', 'депрессия'],
            anxious: ['беспокоюсь', 'тревога', 'страх', 'волнуюсь', 'паника', 'нервничаю'],
            angry: ['злость', 'раздражение', 'бесит', 'ненавижу', 'ярость', 'злой'],
            excited: ['возбужден', 'не терпится', 'вау', 'круто', 'супер', 'класс']
        };

        const lowerText = text.toLowerCase();

        for (const [mood, keywords] of Object.entries(moodKeywords)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return mood;
            }
        }

        return 'neutral';
    }

    generateWelcomeMessage(userName) {
        const welcomes = [
            `Привет, ${userName}! 💙 Я Мила, твой AI-психолог и друг. Я здесь чтобы тебя поддержать, выслушать и помочь. Как твои дела?`,
            `${userName}, рада тебя видеть! 🌟 Я Мила, и я всегда здесь для тебя. Расскажи, что у тебя на душе?`,
            `Здравствуй, ${userName}! Я Мила 💙 Давай поговорим о том, что для тебя важно сейчас. Я тебя слушаю.`
        ];

        return welcomes[Math.floor(Math.random() * welcomes.length)];
    }
}

module.exports = new AITherapist();
