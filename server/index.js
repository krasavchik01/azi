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

    socket.on('joinWaitingRoom', (playerName) => {
        gameEngine.addPlayer(socket, playerName);
    });

    socket.on('startGame', () => {
        gameEngine.startGame(socket.id);
    });

    socket.on('fold', () => {
        gameEngine.playerFold(socket.id);
    });

    socket.on('discardCard', (cardIndex) => {
        gameEngine.playerDiscard(socket.id, cardIndex);
    });

    socket.on('bet', (data) => {
        gameEngine.playerBet(socket.id, data.action, data.raiseAmount);
    });

    socket.on('playCard', (cardIndex) => {
        gameEngine.playCard(socket.id, cardIndex);
    });

    socket.on('declareRaznoMast', () => {
        gameEngine.declareRaznoMast(socket.id);
    });

    socket.on('proposeNaAzi', (targetPlayerId) => {
        gameEngine.proposeNaAzi(socket.id, targetPlayerId);
    });

    socket.on('acceptNaAzi', (proposerId) => {
        gameEngine.acceptNaAzi(socket.id, proposerId);
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
