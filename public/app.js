class AITherapistApp {
    constructor() {
        this.socket = null;
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');

        // Voice features
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.voiceEnabled = true;
        this.isTextMode = false;

        // Session
        this.sessionStartTime = null;
        this.sessionTimer = null;

        this.setupEventListeners();
        this.initVoiceRecognition();

        // Check if logged in
        if (this.token && this.user) {
            this.showWelcomeModal();
        }
    }

    setupEventListeners() {
        // Auth events
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        document.getElementById('loginBtn').addEventListener('click', () => {
            this.login();
        });

        document.getElementById('registerBtn').addEventListener('click', () => {
            this.register();
        });

        // Video call controls
        document.getElementById('startCallBtn').addEventListener('click', () => {
            this.startCall();
        });

        document.getElementById('voiceBtn').addEventListener('click', () => {
            this.toggleVoiceInput();
        });

        document.getElementById('toggleTextBtn').addEventListener('click', () => {
            this.toggleTextMode();
        });

        document.getElementById('toggleVoiceBtn').addEventListener('click', () => {
            this.toggleVoice();
        });

        document.getElementById('toggleChatBtn').addEventListener('click', () => {
            this.toggleChat();
        });

        document.getElementById('toggleChat').addEventListener('click', () => {
            this.toggleChat();
        });

        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendTextMessage();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendTextMessage();
            }
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'ru-RU';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;

            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');

                this.updateTranscription(transcript);

                if (event.results[0].isFinal) {
                    this.sendVoiceMessage(transcript);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopListening();
            };

            this.recognition.onend = () => {
                this.stopListening();
            };
        } else {
            console.warn('Speech recognition not supported');
        }
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'flex';
    }

    showLoginForm() {
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'flex';
    }

    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            alert('Заполните все поля');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

                this.showWelcomeModal();
            } else {
                alert(data.error || 'Ошибка входа');
            }
        } catch (error) {
            alert('Ошибка соединения');
        }
    }

    async register() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        if (!name || !email || !password) {
            alert('Заполните все поля');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

                this.showWelcomeModal();
            } else {
                alert(data.error || 'Ошибка регистрации');
            }
        } catch (error) {
            alert('Ошибка соединения');
        }
    }

    logout() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        location.reload();
    }

    showWelcomeModal() {
        document.getElementById('authScreen').classList.remove('active');
        document.getElementById('chatScreen').classList.add('active');
        document.getElementById('welcomeModal').classList.add('active');
    }

    startCall() {
        document.getElementById('welcomeModal').classList.remove('active');
        this.initSocket();
        this.startSessionTimer();
    }

    startSessionTimer() {
        this.sessionStartTime = Date.now();
        this.sessionTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('sessionTime').textContent =
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    initSocket() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.socket.emit('authenticate', this.token);
        });

        this.socket.on('authenticated', (data) => {
            if (data.success) {
                console.log('Authenticated');
                this.loadConversation(data.conversation);
            } else {
                alert('Ошибка аутентификации');
                this.logout();
            }
        });

        this.socket.on('message', (message) => {
            this.displayMessage(message);

            // Speak the AI response
            if (message.role === 'assistant' && this.voiceEnabled) {
                this.speak(message.content);
            }
        });

        this.socket.on('error', (data) => {
            alert(data.message);
        });
    }

    loadConversation(conversation) {
        if (conversation.messages && conversation.messages.length > 0) {
            conversation.messages.forEach(msg => {
                this.displayMessage(msg, false);
            });
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            alert('Распознавание речи не поддерживается вашим браузером');
            return;
        }

        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (this.isSpeaking) {
            this.synthesis.cancel();
        }

        this.isListening = true;
        document.getElementById('voiceBtn').classList.add('active');
        document.querySelector('#voiceBtn .label').textContent = 'Слушаю...';
        document.getElementById('transcription').classList.add('active');

        this.recognition.start();
        this.animateMouth(true);
    }

    stopListening() {
        this.isListening = false;
        document.getElementById('voiceBtn').classList.remove('active');
        document.querySelector('#voiceBtn .label').textContent = 'Нажми и говори';
        document.getElementById('transcription').classList.remove('active');

        this.animateMouth(false);
    }

    updateTranscription(text) {
        document.getElementById('transcriptionText').textContent = text;
    }

    sendVoiceMessage(transcript) {
        if (!transcript.trim() || !this.socket) return;

        this.socket.emit('sendMessage', { content: transcript });
        this.updateTranscription('Обрабатываю...');
    }

    sendTextMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();

        if (!content || !this.socket) return;

        input.value = '';
        this.socket.emit('sendMessage', { content });
    }

    speak(text) {
        if (!this.synthesis || !this.voiceEnabled) return;

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;

        // Find Russian voice if available
        const voices = this.synthesis.getVoices();
        const russianVoice = voices.find(voice => voice.lang.startsWith('ru'));
        if (russianVoice) {
            utterance.voice = russianVoice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.showSpeakingIndicator(true);
            this.animateMouth(true);
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.showSpeakingIndicator(false);
            this.animateMouth(false);
        };

        this.synthesis.speak(utterance);
    }

    animateMouth(talking) {
        const mouth = document.getElementById('mouth');
        if (talking) {
            mouth.classList.add('talking');
        } else {
            mouth.classList.remove('talking');
        }
    }

    showSpeakingIndicator(show) {
        const indicator = document.getElementById('speakingIndicator');
        if (show) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }

    toggleTextMode() {
        this.isTextMode = !this.isTextMode;

        const voiceBtn = document.getElementById('voiceBtn');
        const textContainer = document.getElementById('textInputContainer');
        const toggleBtn = document.getElementById('toggleTextBtn');

        if (this.isTextMode) {
            voiceBtn.style.display = 'none';
            textContainer.style.display = 'flex';
            toggleBtn.style.background = 'rgba(102, 126, 234, 0.3)';
        } else {
            voiceBtn.style.display = 'flex';
            textContainer.style.display = 'none';
            toggleBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        }
    }

    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;

        const btn = document.getElementById('toggleVoiceBtn');

        if (this.voiceEnabled) {
            btn.textContent = '🔊';
            btn.classList.remove('muted');
        } else {
            btn.textContent = '🔇';
            btn.classList.add('muted');
            if (this.synthesis) {
                this.synthesis.cancel();
            }
        }
    }

    toggleChat() {
        const overlay = document.getElementById('chatOverlay');
        overlay.classList.toggle('open');
    }

    displayMessage(message, animate = true) {
        const container = document.getElementById('messagesContainer');

        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role === 'user' ? 'user' : 'ai'}`;
        if (!animate) messageEl.style.animation = 'none';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message.content;

        const time = document.createElement('div');
        time.className = 'message-time';
        const date = new Date(message.timestamp);
        time.textContent = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        bubble.appendChild(content);
        bubble.appendChild(time);
        messageEl.appendChild(bubble);

        container.appendChild(messageEl);
        this.scrollChatToBottom();
    }

    scrollChatToBottom() {
        const container = document.getElementById('messagesContainer');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }
}

// Initialize app
const app = new AITherapistApp();

// Load voices when available
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
    };
}
