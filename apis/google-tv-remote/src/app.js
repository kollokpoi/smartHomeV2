// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const remoteRoutes = require('./routes');
const adbRemote = require('./classes/ADBRemote');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Роуты
app.use('/', remoteRoutes);

// Запуск сервера с инициализацией ADB
const PORT = process.env.PORT || 3001;

async function startServer() {
    await adbRemote.init();
    
    app.listen(PORT, () => {
        console.log(`🚀 Remote API запущен на порту ${PORT}`);
    });
}

startServer().catch(err => {
    console.error('❌ Ошибка при запуске сервера:', err);
    process.exit(1);
});

// Обработка завершения
process.on('SIGTERM', () => {
    console.log('🛑 Завершение работы...');
    process.exit(0);
});