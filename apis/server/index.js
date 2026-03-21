
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const routes = require("./src/routes");
const logger = require("./src/utils/logger");
const deviceChecker = require('./services/deviceCheckerService')

const { sequelize } = require('./src/models');

const app = express();
const port = process.env.PORT || 3000;

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
    
    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    
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
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  deviceChecker.stop();
  process.exit(0);
});

startServer();