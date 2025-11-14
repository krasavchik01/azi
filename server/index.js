const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const GameEngine = require('./game/engine');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, '../public')));

const gameEngine = new GameEngine(io);

io.on('connection', (socket) => {
    console.log(`🎮 Player connected: ${socket.id}`);

    socket.on('joinGame', (playerName) => {
        gameEngine.addPlayer(socket, playerName);
    });

    socket.on('playCard', (data) => {
        gameEngine.playCard(socket.id, data);
    });

    socket.on('attack', (data) => {
        gameEngine.attack(socket.id, data);
    });

    socket.on('endTurn', () => {
        gameEngine.endTurn(socket.id);
    });

    socket.on('useAbility', (data) => {
        gameEngine.useAbility(socket.id, data);
    });

    socket.on('disconnect', () => {
        console.log(`👋 Player disconnected: ${socket.id}`);
        gameEngine.removePlayer(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 АЗИ Card Game Server running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} to play!`);
});
