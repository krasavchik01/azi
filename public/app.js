class AITherapistApp {
    constructor() {
        this.socket = null;
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');

        this.setupEventListeners();

        // Check if logged in
        if (this.token && this.user) {
            this.showChatScreen();
            this.initSocket();
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

        // Chat events
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.newConversation();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Auto-resize textarea
        const textarea = document.getElementById('messageInput');
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
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

                this.showChatScreen();
                this.initSocket();
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

                this.showChatScreen();
                this.initSocket();
            } else {
                alert(data.error || 'Ошибка регистрации');
            }
        } catch (error) {
            alert('Ошибка соединения');
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        location.reload();
    }

    showChatScreen() {
        document.getElementById('authScreen').classList.remove('active');
        document.getElementById('chatScreen').classList.add('active');
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
            this.hideTypingIndicator();
        });

        this.socket.on('conversationStarted', (data) => {
            this.clearMessages();
        });

        this.socket.on('error', (data) => {
            alert(data.message);
            this.hideTypingIndicator();
        });
    }

    loadConversation(conversation) {
        this.clearMessages();

        if (conversation.messages && conversation.messages.length > 0) {
            conversation.messages.forEach(msg => {
                this.displayMessage(msg, false);
            });
            this.scrollToBottom();
        }
    }

    clearMessages() {
        const container = document.getElementById('messagesContainer');
        // Remove all messages except welcome
        const messages = container.querySelectorAll('.message, .typing-indicator');
        messages.forEach(msg => msg.remove());
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();

        if (!content || !this.socket) return;

        input.value = '';
        input.style.height = 'auto';

        // Send to server
        this.socket.emit('sendMessage', { content });

        // Show typing indicator
        this.showTypingIndicator();
    }

    displayMessage(message, animate = true) {
        const container = document.getElementById('messagesContainer');

        // Remove welcome message if exists
        const welcome = container.querySelector('.welcome-message');
        if (welcome) welcome.remove();

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
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const container = document.getElementById('messagesContainer');

        let indicator = container.querySelector('.typing-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            indicator.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            `;
            container.appendChild(indicator);
        }

        indicator.classList.add('active');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.classList.remove('active');
        }
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }

    newConversation() {
        if (confirm('Начать новый разговор? Текущий будет сохранён.')) {
            this.socket.emit('newConversation');
            this.clearMessages();
        }
    }
}

// Initialize app
const app = new AITherapistApp();
