// device-camera.js (эмулятор камеры)
const io = require("socket.io-client");
const cameraService = require("./cameraService");

// Проверяем доступность FFmpeg при запуске
if (!cameraService.checkFFmpegAvailability()) {
  console.error("❌ FFmpeg не доступен. Сервис камеры не может быть запущен.");
  process.exit(1);
}

const socket = io(process.env.SERVER_URL || "http://localhost:3333");
const port = process.env.CAMERA_PORT || 3005;

let deviceId;

socket.emit("register-device", {
  port: port,
  category: "camera",
  commands: ["start_stream", "stop_stream", "take_photo"],
  metadata: cameraService.settings,
});

socket.on("device-registered", (data) => {
  console.log("✅ Устройство зарегистрировано:", data);
  deviceId = data.deviceId;
  
  if (!cameraService.startProcess()) {
    console.error("❌ Не удалось запустить процесс камеры");
  }

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
  cameraService.stop();
});

// Обработка завершения процесса
process.on("SIGTERM", () => {
  console.log("🛑 Получен сигнал SIGTERM, остановка камеры...");
  cameraService.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Получен сигнал SIGINT, остановка камеры...");
  cameraService.stop();
  process.exit(0);
});
