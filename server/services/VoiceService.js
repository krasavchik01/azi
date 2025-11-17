const axios = require('axios');

class VoiceService {
    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        this.voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - приятный женский голос
        this.apiUrl = 'https://api.elevenlabs.io/v1';
        this.enabled = !!this.apiKey;

        if (!this.enabled) {
            console.warn('⚠️  ElevenLabs API key не найден, используется браузерный TTS');
        } else {
            console.log('✅ ElevenLabs voice service активирован');
        }
    }

    async textToSpeech(text) {
        if (!this.enabled) {
            return { success: false, useBrowserTTS: true };
        }

        try {
            const response = await axios.post(
                `${this.apiUrl}/text-to-speech/${this.voiceId}`,
                {
                    text,
                    model_id: 'eleven_multilingual_v2', // Поддержка русского
                    voice_settings: {
                        stability: 0.5,        // Средняя стабильность для живости
                        similarity_boost: 0.75, // Высокое сходство с оригиналом
                        style: 0.5,            // Выразительность
                        use_speaker_boost: true
                    }
                },
                {
                    headers: {
                        'Accept': 'audio/mpeg',
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer'
                }
            );

            return {
                success: true,
                audio: Buffer.from(response.data).toString('base64'),
                contentType: 'audio/mpeg'
            };

        } catch (error) {
            console.error('ElevenLabs TTS error:', error.message);
            return { success: false, useBrowserTTS: true, error: error.message };
        }
    }

    // Альтернативные голоса для выбора
    getAvailableVoices() {
        return {
            sarah: 'EXAVITQu4vr4xnSDxMaL',  // Теплый женский
            rachel: '21m00Tcm4TlvDq8ikWAM', // Энергичный женский
            bella: 'pMsXgVXv3BLzUgSXRplE',  // Мягкий женский
            domi: 'AZnzlk1XvdvUeBnXmlld'    // Уверенный женский
        };
    }

    setVoice(voiceName) {
        const voices = this.getAvailableVoices();
        if (voices[voiceName]) {
            this.voiceId = voices[voiceName];
            console.log(`Голос изменен на: ${voiceName}`);
        }
    }
}

module.exports = new VoiceService();
