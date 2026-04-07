
require('dotenv').config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const routes = require("./src/routes");
const logger = require("./src/utils/logger");
const deviceChecker = require('./services/deviceCheckerService')
const { generalLimiter, authLimiter } = require('./src/middlewares/rateLimiter');
const path = require('path');
const WebSocketService = require('./src/services/websocketService');

const { sequelize } = require('./src/models');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<h1>IoT Hub Server Running</h1>");
});
const socketIo = require("socket.io");
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Инициализация WebSocket сервиса
const wsService = new WebSocketService(io);
wsService.initialize();

app.use(generalLimiter);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.options("/*path", cors());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        fontSrc: ["'self'", "https:", "data:"],
        connectSrc: ["'self'", "http:", "https:", "ws:", "wss:"],
      },
    },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/icons/defaults', express.static(path.join(__dirname, 'public/icons/defaults')));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  logger.error("Global error handler:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const status = err.status || 500;
  const response = {
    success: false,
    message: err.message || "Internal server error",
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.error = err.toString();
  }

  res.status(status).json(response);
});


async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ База данных подключена");
    
    await sequelize.sync({ alter: true });
    
    await deviceChecker.start();
    
    app.listen(port, () => {
      console.log(`🚀 Сервер запущен на порту ${port}`);
      console.log(`📝 Режим: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    console.error("❌ Ошибка:", err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  deviceChecker.stop();
  if (wsService) wsService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  deviceChecker.stop();
  if (wsService) wsService.stop();
  process.exit(0);
});

const PORT = 3333;
server.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`\n📋 Категории устройств:`);
  console.log(`\n✨ Готов к работе!\n`);
});


startServer();