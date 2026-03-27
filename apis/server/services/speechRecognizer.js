// services/speechRecognizer.js
const { spawn } = require("child_process");
const path = require("path");
const EventEmitter = require("events");

class SpeechRecognizer extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.ready = false;
    this.pendingRequest = null;

    this.start();
  }

  start() {
    const venvPath = path.join(__dirname, "./voiceListener/venv");
    const pythonPath =
      process.platform === "win32"
        ? path.join(venvPath, "Scripts", "python.exe")
        : path.join(venvPath, "bin", "python");

    const scriptPath = path.join(
      __dirname,
      "./voiceListener/recognizer.py",
    );

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
      console.log("[Python]", message);
      if (message.includes("ready")) {
        this.ready = true;
        this.emit("ready");
      }
    });

    this.process.on("close", (code) => {
      console.log(`Python process exited with code ${code}`);
      this.ready = false;
      setTimeout(() => this.start(), 5000);
    });
  }

  async recognize(audioBuffer) {
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
}

module.exports = new SpeechRecognizer();
