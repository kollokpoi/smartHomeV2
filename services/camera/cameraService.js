const { spawn } = require("child_process");

class CameraService {
  constructor() {
    this.ffmpegProcess = null;
    this.frameBuffer = null;      // Буфер для сборки текущего кадра
    this.handler = null;
    this.settings = {
      framerate: "15",
      height: "720",
      width: "1280",
    };
  }

  async getFrame() {
    return this.frameBuffer;
  }

  async startProcess() {
    try {
      console.log("Starting FFmpeg process with MJPG input...");

      this.ffmpegProcess = spawn(
        "ffmpeg",
        [
          "-f",
          "v4l2",
          "-input_format",
          "mjpeg",
          "-framerate",
          this.settings.framerate,
          "-video_size",
          `${this.settings.width}x${this.settings.height}`,
          "-i",
          "/dev/video0",
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
          console.log("FFmpeg:", output.trim());
        }
      });

      // Буфер для накопления данных
      let buffer = Buffer.alloc(0);
      let inFrame = false;
      let frameStart = 0;

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
        console.error("FFmpeg process error:", error);
        this.cleanup();
      });

      this.ffmpegProcess.on("close", (code) => {
        console.log("FFmpeg process exited with code:", code);
        this.cleanup();
        setTimeout(() => this.startProcess(), 2000);
      });

      console.log("FFmpeg MJPEG process started successfully");
      return true;
    } catch (error) {
      console.error("Error starting process:", error);
      this.cleanup();
      setTimeout(() => this.startProcess(), 2000);
      return false;
    }
  }

  cleanup() {
    console.log("Cleaning up...");

    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill("SIGTERM");
      this.ffmpegProcess = null;
    }
    
    this.frameBuffer = null;
  }
}

module.exports = new CameraService();