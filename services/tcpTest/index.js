// test-client.js
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('✅ Подключено к серверу!');
    console.log('Socket ID:', socket.id);
    
    // Отправляем тестовое событие
    socket.emit('event', {
        message: 'Привет от клиента!',
        timestamp: Date.now(),
        data: { test: true }
    });
    console.log('📤 Отправлено событие "event"');
});

socket.on('event', (data) => {
    console.log('📥 Получено событие "event":', data);
});

socket.on('disconnect', () => {
    console.log('❌ Отключено от сервера');
});

socket.on('connect_error', (error) => {
    console.error('⚠️ Ошибка подключения:', error.message);
});

// Отправляем событие каждые 5 секунд
let interval = setInterval(() => {
    if (socket.connected) {
        socket.emit('event', {
            type: 'ping',
            timestamp: Date.now(),
            counter: Math.floor(Math.random() * 100)
        });
        console.log('📤 Ping отправлен');
    }
}, 5000);
