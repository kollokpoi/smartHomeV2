
require('dotenv').config();
const { Device } = require("./src/models");
const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const routes = require("./src/routes");
const logger = require("./src/utils/logger");
const deviceChecker = require('./services/deviceCheckerService')
const { generalLimiter, authLimiter } = require('./src/middlewares/rateLimiter');
const path = require('path');

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
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  deviceChecker.stop();
  process.exit(0);
});

const devices = new Map();
const clients = new Map();
const subscriptions = new Map();
const clientSubscriptions = new Map();

io.on("connection", (socket) => {
  console.log(`🔌 Новое подключение: ${socket.id}`);

  socket.on("register-device", async (data) => {
    const ipv4 = socket.request.socket.remoteAddress;
    const cleanIp = ipv4?.replace("::ffff:", "");
    const { port, category, commands } = data;

    const device = await Device.findOne({ where: { ip: cleanIp, port } });

    if (!device) return;

    const deviceId = device.id;

    devices.set(deviceId, {
      id: deviceId,
      category: category,
      commands: commands,
      status: "online",
      socketId: socket.id,
      connectedAt: new Date(),
      lastSeen: new Date(),
      lastData: null,
      lastDataTimestamp: null,
      data: [],
    });

    socket.deviceId = deviceId;

    console.log(`✅ Устройство зарегистрировано:`);
    console.log(`   ID: ${deviceId}`);

    broadcastDevicesList();

    socket.emit("device-registered", {
      status: "ok",
      deviceId: deviceId,
      category: category,
      message: "Устройство успешно зарегистрировано",
    });
  });

  socket.on("register-client", (data) => {
    const { clientId, name } = data;

    clients.set(clientId, {
      id: clientId,
      socketId: socket.id,
      connectedAt: new Date(),
      subscriptions: new Set(),
    });
    socket.clientId = clientId;

    console.log(
      `👤 Клиент зарегистрирован: ${clientId} (${name || "unnamed"})`,
    );

    sendDevicesByCategory(socket);
    sendDevicesCommands(socket);
  });

  socket.on("subscribe-devices", (data) => {
    const { deviceIds, clientId } = data;

    if (!Array.isArray(deviceIds)) {
      socket.emit("error", { message: "deviceIds должен быть массивом" });
      return;
    }

    const results = [];

    for (const deviceId of deviceIds) {
      const device = devices.get(deviceId);
      if (!device) {
        results.push({
          deviceId: deviceId,
          status: "error",
          message: `Устройство ${deviceId} не найдено`,
          data: [],
        });
        continue;
      }

      if (!subscriptions.has(deviceId)) {
        subscriptions.set(deviceId, new Set());
      }
      subscriptions.get(deviceId).add(socket.id);

      if (!clientSubscriptions.has(clientId)) {
        clientSubscriptions.set(clientId, new Set());
      }
      clientSubscriptions.get(clientId).add(deviceId);

      const client = clients.get(clientId);
      if (client) {
        client.subscriptions.add(deviceId);
        clients.set(clientId, client);
      }

      results.push({
        deviceId: deviceId,
        status: "ok",
        category: device.category,
        name: device.name,
      });

      console.log(
        `📡 Клиент ${clientId} подписался на устройство ${deviceId} (${device.category})`,
      );

      if (device.lastData) {
        socket.emit("device-data", {
          deviceId: deviceId,
          category: device.category,
          data: device.lastData,
          timestamp: device.lastDataTimestamp,
        });
      }
    }

    socket.emit("subscribed", { results });

    sendClientSubscriptions(socket, clientId);
  });

  socket.on("subscribe-by-category", (data) => {
    const { categories, clientId } = data;

    const categoriesArray = Array.isArray(categories)
      ? categories
      : [categories];
    const deviceIds = [];

    for (const [deviceId, device] of devices) {
      if (categoriesArray.includes(device.category)) {
        deviceIds.push(deviceId);
      }
    }

    if (deviceIds.length > 0) {
      socket.emit("subscribe-devices", { deviceIds, clientId });
    } else {
      socket.emit("error", {
        message: `Нет устройств в категориях: ${categoriesArray.join(", ")}`,
      });
    }
  });

  socket.on("unsubscribe-devices", (data) => {
    const { deviceIds, clientId } = data;

    const deviceIdsArray = Array.isArray(deviceIds) ? deviceIds : [deviceIds];

    for (const deviceId of deviceIdsArray) {
      if (subscriptions.has(deviceId)) {
        subscriptions.get(deviceId).delete(socket.id);
        if (subscriptions.get(deviceId).size === 0) {
          subscriptions.delete(deviceId);
        }
      }

      if (clientSubscriptions.has(clientId)) {
        clientSubscriptions.get(clientId).delete(deviceId);
      }

      const client = clients.get(clientId);
      if (client) {
        client.subscriptions.delete(deviceId);
        clients.set(clientId, client);
      }

      console.log(`📡 Клиент ${clientId} отписался от устройства ${deviceId}`);
    }

    socket.emit("unsubscribed", { deviceIds: deviceIdsArray });
    sendClientSubscriptions(socket, clientId);
  });

  socket.on("device-data", (data) => {
    const { deviceId, telemetry, timestamp = Date.now() } = data;

    const device = devices.get(deviceId);
    if (!device) {
      console.warn(
        `⚠️ Неизвестное устройство ${deviceId} пытается отправить данные`,
      );
      return;
    }

    device.lastData = telemetry;
    device.lastDataTimestamp = timestamp;
    device.lastSeen = new Date();
    devices.set(deviceId, device);

    const subscribers = subscriptions.get(deviceId);
    if (subscribers && subscribers.size > 0) {
      const messageData = {
        deviceId: deviceId,
        category: device.category,
        name: device.name,
        data: telemetry,
        timestamp: timestamp,
      };

      for (const subscriberId of subscribers) {
        io.to(subscriberId).emit("device-data", messageData);
      }
    }
  });

  socket.on("send-command", async (data) => {
    const { deviceId, command, params, clientId } = data;

    const device = devices.get(deviceId);
    if (!device) {
      socket.emit("command-response", {
        deviceId: deviceId,
        command: command,
        status: "error",
        message: `Устройство ${deviceId} не найдено`,
      });
      return;
    }

    const client = clients.get(clientId);
    if (client) {
      socket.emit("command-response", {
        deviceId: deviceId,
        command: command,
        status: "error",
        message: "У вас нет прав на управление устройствами",
      });
      return;
    }

    if (!device.commands.includes(command)) {
      socket.emit("command-response", {
        deviceId: deviceId,
        command: command,
        status: "error",
        message: `Команда ${command} не поддерживается устройством ${device.category}`,
      });
      return;
    }

    if (device.status !== "online") {
      socket.emit("command-response", {
        deviceId: deviceId,
        command: command,
        status: "error",
        message: `Устройство ${deviceId} оффлайн`,
      });
      return;
    }

    console.log(
      `🎮 Команда от ${clientId} на ${deviceId} (${device.category}): ${command}`,
      params,
    );

    const deviceSocket = io.sockets.sockets.get(device.socketId);
    if (deviceSocket) {
      deviceSocket.emit("command", {
        command: command,
        params: params || {},
        from: clientId,
        timestamp: Date.now(),
      });
    } else {
      socket.emit("command-response", {
        deviceId: deviceId,
        command: command,
        status: "error",
        message: "Устройство недоступно",
      });
    }
  });

  socket.on("command-result", (data) => {
    const { deviceId, command, result, status, error } = data;

    console.log(
      `📨 Ответ от ${deviceId} на команду ${command}:`,
      result || error,
    );

    const subscribers = subscriptions.get(deviceId);
    if (subscribers) {
      const responseData = {
        deviceId: deviceId,
        command: command,
        status: status || (result ? "success" : "error"),
        result: result,
        error: error,
        timestamp: Date.now(),
      };

      for (const subscriberId of subscribers) {
        io.to(subscriberId).emit("command-response", responseData);
      }
    }
  });

  socket.on("device-status", (data) => {
    const { deviceId, status } = data;

    const device = devices.get(deviceId);
    if (device) {
      device.status = status;
      device.lastSeen = new Date();
      devices.set(deviceId, device);

      console.log(`🔄 Статус устройства ${deviceId}: ${status}`);

      const subscribers = subscriptions.get(deviceId);
      if (subscribers) {
        const statusData = {
          deviceId: deviceId,
          category: device.category,
          status: status,
          timestamp: Date.now(),
        };

        for (const subscriberId of subscribers) {
          io.to(subscriberId).emit("device-status-update", statusData);
        }
      }

      broadcastDevicesList();
    }
  });

  socket.on("disconnect", () => {
    if (socket.deviceId) {
      const device = devices.get(socket.deviceId);
      if (device) {
        device.status = "offline";
        devices.set(socket.deviceId, device);

        console.log(`🔴 Устройство отключилось: ${socket.deviceId}`);

        const subscribers = subscriptions.get(socket.deviceId);
        if (subscribers) {
          const statusData = {
            deviceId: socket.deviceId,
            category: device.category,
            status: "offline",
            timestamp: Date.now(),
          };

          for (const subscriberId of subscribers) {
            io.to(subscriberId).emit("device-status-update", statusData);
          }
        }

        broadcastDevicesList();
      }
    } else if (socket.clientId) {
      console.log(`👋 Клиент отключился: ${socket.clientId}`);

      const client = clients.get(socket.clientId);
      if (client) {
        for (const deviceId of client.subscriptions) {
          if (subscriptions.has(deviceId)) {
            subscriptions.get(deviceId).delete(socket.id);
            if (subscriptions.get(deviceId).size === 0) {
              subscriptions.delete(deviceId);
            }
          }
        }
        clients.delete(socket.clientId);
        clientSubscriptions.delete(socket.clientId);
      }
    }
  });

  function broadcastDevicesList() {
    const devicesList = getDevicesList();
    io.emit("devices-list-update", devicesList);
  }

  function getDevicesList() {
    const devicesByCategory = [];

    for (const [id, device] of devices) {
      devicesByCategory.push({
        id: device.id,
        name: device.name,
        category: device.category,
        status: device.status,
        lastSeen: device.lastSeen,
      });
    }

    return devicesByCategory;
  }

  function sendDevicesByCategory(socket) {
    const devicesByCategory = getDevicesList();
    socket.emit("devices-by-category", devicesByCategory);
  }

  function sendDevicesCommands(socket) {
    const devicesCommands = {};

    for (const [deviceId, device] of devices) {
      devicesCommands[deviceId] = {
        id: device.id,
        name: device.name,
        category: device.category,
        commands: device.commands,
        status: device.status,
      };
    }

    socket.emit("devices-commands", devicesCommands);
  }

  function sendClientSubscriptions(socket, clientId) {
    const subscriptions = clientSubscriptions.get(clientId) || new Set();
    socket.emit("my-subscriptions", Array.from(subscriptions));
  }
});

const PORT = 3333;
server.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`\n📋 Категории устройств:`);
  console.log(`\n✨ Готов к работе!\n`);
});


startServer();