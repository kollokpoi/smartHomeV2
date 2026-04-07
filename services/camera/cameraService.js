const { spawn } = require("child_process");
const { execSync } = require("child_process");
const logger = require("../../apis/server/src/utils/logger");

class CameraService {
  constructor() {
    this.ffmpegProcess = null;
    this.frameBuffer = null;
    this.handler = null;
    this.settings = {
      framerate: process.env.CAMERA_FRAMERATE || "15",
      height: process.env.CAMERA_HEIGHT || "720",
      width: process.env.CAMERA_WIDTH || "1280",
      device: process.env.CAMERA_DEVICE || "/dev/video0",
      inputFormat: process.env.CAMERA_INPUT_FORMAT || "mjpeg",
    };
    this.isFFmpegAvailable = false;
  }

  checkFFmpegAvailability() {
    try {
      execSync("ffmpeg -version", { stdio: "ignore" });
      this.isFFmpegAvailable = true;
      logger.info("FFmpeg доступен");
      return true;
    } catch (error) {
      this.isFFmpegAvailable = false;
      logger.error("FFmpeg не найден. Установите FFmpeg для работы камеры.");
      return false;
    }
  }

  async getFrame() {
    return this.frameBuffer;
  }

  async startProcess() {
    // Проверяем доступность FFmpeg перед запуском
    if (!this.isFFmpegAvailable && !this.checkFFmpegAvailability()) {
      logger.error("Невозможно запустить камеру: FFmpeg не доступен");
      return false;
    }

    try {
      logger.info("Запуск процесса FFmpeg с MJPG входом...");

      this.ffmpegProcess = spawn(
        "ffmpeg",
        [
          "-f",
          "v4l2",
          "-input_format",
          this.settings.inputFormat,
          "-framerate",
          this.settings.framerate,
          "-video_size",
          `${this.settings.width}x${this.settings.height}`,
          "-i",
          this.settings.device,
          "-c:v",
          "copy",
          "-f",
          "mjpeg",
          "-",
        ],
        {
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      this.ffmpegProcess.stderr.on("data", (data) => {
        const output = data.toString();
        if (
          output.includes("frame=") ||
          output.includes("Error") ||
          output.includes("warning")
        ) {
          logger.debug(`FFmpeg: ${output.trim()}`);
        }
      });

      // Буфер для накопления данных
      let buffer = Buffer.alloc(0);
      
      this.ffmpegProcess.stdout.on("data", (chunk) => {
        // Добавляем новые данные в буфер
        buffer = Buffer.concat([buffer, chunk]);
        
        // Ищем маркеры JPEG: начало кадра FF D8, конец FF D9
        let searchPos = 0;
        
        while (true) {
          // Ищем начало JPEG (FF D8)
          const startIdx = buffer.indexOf(Buffer.from([0xFF, 0xD8]), searchPos);
          if (startIdx === -1) break;
          
          // Ищем конец JPEG (FF D9) после начала
          const endIdx = buffer.indexOf(Buffer.from([0xFF, 0xD9]), startIdx + 2);
          if (endIdx === -1) break;
          
          // Полный кадр найден
          const frame = buffer.subarray(startIdx, endIdx + 2);
          
          // Сохраняем полный кадр
          this.frameBuffer = frame;
          
          // Вызываем обработчик с полным кадром
          if (this.handler) {
            this.handler(frame);
          }
          
          // Сдвигаем буфер, удаляя обработанный кадр
          buffer = buffer.subarray(endIdx + 2);
          searchPos = 0;
        }
      });

      this.ffmpegProcess.on("error", (error) => {
        logger.error(`Ошибка процесса FFmpeg: ${error.message}`);
        this.cleanup();
      });

      this.ffmpegProcess.on("close", (code) => {
        logger.info(`Процесс FFmpeg завершился с кодом: ${code}`);
        this.cleanup();
        setTimeout(() => this.startProcess(), 2000);
      });

      logger.info("Процесс FFmpeg MJPEG успешно запущен");
      return true;
    } catch (error) {
      logger.error(`Ошибка запуска процесса: ${error.message}`);
      this.cleanup();
      setTimeout(() => this.startProcess(), 2000);
      return false;
    }
  }

  cleanup() {
    logger.info("Очистка ресурсов камеры...");

    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill("SIGTERM");
      this.ffmpegProcess = null;
    }
    
    this.frameBuffer = null;
  }

  stop() {
    logger.info("Остановка сервиса камеры");
    this.cleanup();
    if (this.handler) {
      this.handler = null;
    }
  }
}

module.exports = new CameraService();