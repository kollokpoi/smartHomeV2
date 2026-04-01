const server = require("http").createServer();
const io = require("socket.io")(server);

const clients = new Map();
const devices = new Map();
const deviceSubscriptions = new Map();
const clientSubscriptions = new Map();
io.on("connection", (client) => {
  client.on("device-registration", (data) => {
    const { deviceId, deviceType, deviceCommands } = data;

    devices.set(deviceId, {
      id: deviceId,
      name: name || deviceId,
      type: deviceType,
      commands: deviceCommands,
      status: "online",

      socketId: socket.id,
      connectedAt: new Date(),
      lastSeen: new Date(),
      lastData: null,
      lastDataTimestamp: null,
    });

    socket.emit("device-registered", {
      status: "ok",
      deviceId: deviceId,
      category: validCategory,
      message: "Устройство успешно зарегистрировано",
    });

    socket.deviceId = deviceId;
  });

  socket.on("register-client", (data) => {
    const { clientId } = data;

    clients.set(clientId, {
      id: clientId,
      socketId: socket.id,
      connectedAt: new Date(),
      subscriptions: new Set(),
    });
  });

  client.on("disconnect", () => {
    clients.delete(client.id);
  });
});

server.listen(3000);
