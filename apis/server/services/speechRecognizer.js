// services/speechRecognizer.js
const { spawn } = require("child_process");
const path = require("path");
const EventEmitter = require("events");
const logger = require("../src/utils/logger");

class SpeechRecognizer extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.ready = false;
    this.pendingRequest = null;
    this.pythonAvailable = false;

    // Проверяем доступность Python перед запуском
    this.checkPythonAvailability().then((available) => {
      if (available) {
        this.start();
      } else {
        logger.warn('Python environment not available, speech recognition disabled');
        this.emit('unavailable');
      }
    });
  }

  async checkPythonAvailability() {
    const venvPath = path.join(__dirname, "./voiceListener/venv");
    const pythonPath =
      process.platform === "win32"
        ? path.join(venvPath, "Scripts", "python.exe")
        : path.join(venvPath, "bin", "python");

    try {
      const fs = require('fs');
      if (fs.existsSync(pythonPath)) {
        this.pythonAvailable = true;
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  start() {
    if (!this.pythonAvailable) {
      logger.warn('Cannot start speech recognizer: Python not available');
      return;
    }

    const venvPath = path.join(__dirname, "./voiceListener/venv");
    const pythonPath =
      process.platform === "win32"
        ? path.join(venvPath, "Scripts", "python.exe")
        : path.join(venvPath, "bin", "python");

    const scriptPath = path.join(
      __dirname,
      "./voiceListener/recognizer.py",
    );

    try {
      this.process = spawn(pythonPath, [scriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });
      
      this.process.stdout.setEncoding("utf8");
      this.process.stderr.setEncoding("utf8");

      this.process.stdout.on("data", (data) => {
        const text = data.toString().trim();
        if (this.pendingRequest) {
          this.pendingRequest.resolve(text);
          this.pendingRequest = null;
        }
      });

      this.process.stderr.on("data", (data) => {
        const message = data.toString().trim();
        logger.debug(`[Python] ${message}`);
        if (message.includes("ready")) {
          this.ready = true;
          this.emit("ready");
        }
      });

      this.process.on("close", (code) => {
        logger.info(`Python process exited with code ${code}`);
        this.ready = false;
        setTimeout(() => this.start(), 5000);
      });

      this.process.on("error", (error) => {
        logger.error(`Failed to start Python process: ${error.message}`);
        this.ready = false;
        this.emit('error', error);
      });
    } catch (error) {
      logger.error(`Error spawning Python process: ${error.message}`);
      this.ready = false;
      this.emit('error', error);
    }
  }

  async recognize(audioBuffer) {
    if (!this.pythonAvailable) {
      throw new Error('Speech recognition is not available - Python environment not found');
    }

    if (!this.ready) {
      await new Promise((resolve) => this.once("ready", resolve));
    }

    return new Promise((resolve, reject) => {
      this.pendingRequest = { resolve, reject };
      const audioBase64 = audioBuffer.toString("base64");
      this.process.stdin.write(audioBase64 + "\n");

      setTimeout(() => {
        if (this.pendingRequest) {
          this.pendingRequest.reject(new Error("Recognition timeout"));
          this.pendingRequest = null;
        }
      }, 30000);
    });
  }

  isAvailable() {
    return this.pythonAvailable;
  }
}

module.exports = new SpeechRecognizer();
