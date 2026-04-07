/**
 * TCP Hub - демонстрационный сервис для работы с WebSocket
 * Использует централизованный WebSocketService из apis/server
 */

const http = require("http");
const socketIo = require("socket.io");
const WebSocketService = require('../../apis/server/src/services/websocketService');

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<h1>IoT Hub Server Running</h1>");
});

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Инициализация WebSocket сервиса
const wsService = new WebSocketService(io);
wsService.initialize();

const PORT = 3333;
server.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`\n✨ Готов к работе!\n`);
});

// Обработка сигналов завершения
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  if (wsService) wsService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  if (wsService) wsService.stop();
  process.exit(0);
});
