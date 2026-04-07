// device-camera.js (эмулятор камеры)
const io = require("socket.io-client");
const socket = io("http://192.168.0.3:3333");
const cameraService = require("./cameraService");

let deviceId;
const port = 3005
socket.emit("register-device", {
  port: port,
  category: "camera",
  commands: ["start_stream", "stop_stream", "take_photo"],
  metadata: cameraService.settings,
});

socket.on("device-registered", (data) => {
  console.log("✅ Устройство зарегистрировано:", data);
  deviceId = data.deviceId
  cameraService.startProcess();

  let frameCount = 0;
  cameraService.handler = (frame) => {
    socket.emit("device-data", {
      deviceId: deviceId,
      telemetry: {
        frame: frameCount++,
        timestamp: Date.now(),
        image: frame,
      },
    });
  };
});

socket.on("command", async (data) => {
  console.log(`🎮 Получена команда: ${data.command}`, data.params);

  let result;
  switch (data.command) {
    case "start_stream":
      const started = await cameraService.startProcess();
      result = { status: "streaming", isStarted: started };
      break;
    case "stop_stream":
      cameraService.cleanup();
      result = { status: "stopped" };
      break;
    case "take_photo":
      const frame = await cameraService.getFrame();
      result = frame;
      break;
    default:
      result = { received: true };
  }

  socket.emit("command-result", {
    deviceId: deviceId,
    command: data.command,
    status: "success",
    result: result,
  });
});

socket.on("connect", () => {
  console.log("🔌 Подключено к серверу");
});

socket.on("disconnect", () => {
  console.log("🔌 Отключено от сервера");
  cameraService.cleanup();
});
