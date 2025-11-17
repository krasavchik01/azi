const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Conversation = require('./models/Conversation');
const aiTherapist = require('./services/AITherapist');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection (optional - works without DB too)
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.log('⚠️  MongoDB not available, using in-memory storage'));
}

// In-memory storage as fallback
const sessions = new Map();
const userConversations = new Map();

// Auth Routes - Simplified (только имя)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Введите ваше имя' });
        }

        // Always use in-memory storage for simplicity
        const userId = Date.now().toString();
        const email = `${userId}@temp.local`; // Auto-generate temporary email
        const user = { id: userId, email, name: name.trim(), subscription: 'free' };
        sessions.set(userId, user);

        const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

        res.json({
            success: true,
            token,
            user
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login removed - only simple registration by name

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const user = await User.findById(req.userId);
            res.json({
                id: user._id,
                name: user.name,
                email: user.email,
                subscription: user.subscription,
                subscriptionEnd: user.subscriptionEnd,
                profile: user.profile
            });
        } else {
            const user = sessions.get(req.userId);
            res.json(user);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Socket.IO for real-time chat
io.on('connection', (socket) => {
    console.log(`💙 User connected: ${socket.id}`);

    // Authenticate socket connection
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            socket.userId = decoded.userId;

            // Load conversation history
            let conversation;
            if (mongoose.connection.readyState === 1) {
                conversation = await Conversation.findOne({ userId: socket.userId })
                    .sort({ updatedAt: -1 });

                if (!conversation) {
                    conversation = await Conversation.create({
                        userId: socket.userId,
                        messages: []
                    });
                }
            } else {
                conversation = userConversations.get(socket.userId) || {
                    messages: [],
                    topics: [],
                    insights: []
                };
                userConversations.set(socket.userId, conversation);
            }

            // Send history
            socket.emit('authenticated', {
                success: true,
                conversation: {
                    messages: conversation.messages.slice(-50), // Last 50 messages
                    topics: conversation.topics,
                    insights: conversation.insights
                }
            });

            // Send welcome if new conversation
            if (conversation.messages.length === 0) {
                const user = mongoose.connection.readyState === 1 ?
                    await User.findById(socket.userId) :
                    sessions.get(socket.userId);

                const welcome = aiTherapist.generateWelcomeMessage(user.name);

                const welcomeMsg = {
                    role: 'assistant',
                    content: welcome,
                    timestamp: new Date(),
                    mood: 'neutral'
                };

                conversation.messages.push(welcomeMsg);
                if (mongoose.connection.readyState === 1) {
                    await conversation.save();
                }

                socket.emit('message', welcomeMsg);
            }

        } catch (error) {
            socket.emit('authenticated', { success: false, error: 'Неверный токен' });
        }
    });

    // Handle user message
    socket.on('sendMessage', async (data) => {
        try {
            if (!socket.userId) {
                return socket.emit('error', { message: 'Не авторизован' });
            }

            const { content } = data;

            // Analyze mood
            const mood = await aiTherapist.analyzeMood(content);

            // Save user message
            const userMessage = {
                role: 'user',
                content,
                timestamp: new Date(),
                mood
            };

            // Get or create conversation
            let conversation;
            if (mongoose.connection.readyState === 1) {
                conversation = await Conversation.findOne({ userId: socket.userId })
                    .sort({ updatedAt: -1 });

                if (!conversation) {
                    conversation = await Conversation.create({ userId: socket.userId, messages: [] });
                }

                conversation.messages.push(userMessage);
                await conversation.save();
            } else {
                conversation = userConversations.get(socket.userId);
                conversation.messages.push(userMessage);
            }

            // Echo user message
            socket.emit('message', userMessage);

            // Get AI response
            const recentMessages = conversation.messages.slice(-20).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Get user context
            const user = mongoose.connection.readyState === 1 ?
                await User.findById(socket.userId) :
                sessions.get(socket.userId);

            const context = {
                name: user.name,
                age: user.profile?.age,
                goals: user.profile?.goals || [],
                previousTopics: conversation.topics || [],
                insights: conversation.insights || []
            };

            const aiResponse = await aiTherapist.chat(recentMessages, context);

            if (aiResponse.success) {
                const assistantMessage = {
                    role: 'assistant',
                    content: aiResponse.message,
                    timestamp: new Date(),
                    mood: 'neutral'
                };

                // Save AI response
                conversation.messages.push(assistantMessage);
                if (mongoose.connection.readyState === 1) {
                    await conversation.save();
                }

                // Send to user
                socket.emit('message', assistantMessage);
            } else {
                socket.emit('error', { message: aiResponse.message });
            }

        } catch (error) {
            console.error('Chat error:', error);
            socket.emit('error', { message: 'Что-то пошло не так 😔' });
        }
    });

    // Start new conversation
    socket.on('newConversation', async () => {
        try {
            if (!socket.userId) return;

            if (mongoose.connection.readyState === 1) {
                const conversation = await Conversation.create({
                    userId: socket.userId,
                    messages: []
                });

                socket.emit('conversationStarted', {
                    conversation: {
                        messages: [],
                        topics: [],
                        insights: []
                    }
                });
            } else {
                userConversations.set(socket.userId, {
                    messages: [],
                    topics: [],
                    insights: []
                });

                socket.emit('conversationStarted', {
                    conversation: {
                        messages: [],
                        topics: [],
                        insights: []
                    }
                });
            }

            // Send welcome
            const user = mongoose.connection.readyState === 1 ?
                await User.findById(socket.userId) :
                sessions.get(socket.userId);

            const welcome = aiTherapist.generateWelcomeMessage(user.name);
            socket.emit('message', {
                role: 'assistant',
                content: welcome,
                timestamp: new Date(),
                mood: 'neutral'
            });

        } catch (error) {
            socket.emit('error', { message: 'Не удалось создать новый разговор' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`👋 User disconnected: ${socket.id}`);
    });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Неверный токен' });
        }
        req.userId = decoded.userId;
        next();
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌟 AI Therapist Server running on port ${PORT}`);
    console.log(`💙 Open http://localhost:${PORT} to start talking!`);
});
