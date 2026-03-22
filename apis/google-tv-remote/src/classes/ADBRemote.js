// services/adbRemote.js
const { exec } = require('child_process');

const TV_IP = '192.168.0.101';
const ADB_PORT = 5555;

class ADBRemote {
    constructor() {
        this.connected = false;
        this.currentApp = null;
        this.connectionPromise = null;
        this.lastError = null;
    }

    async adbCommand(cmd) {
        return new Promise((resolve) => {
            exec(`adb ${cmd}`, (error, stdout, stderr) => {
                if (error) {
                    console.log(`❌ Ошибка ADB: ${stderr || error.message}`);
                    resolve({ success: false, output: stderr || error.message });
                } else {
                    console.log(`✅ ${stdout.trim() || 'Успешно'}`);
                    resolve({ success: true, output: stdout.trim() });
                }
            });
        });
    }

    async connect() {
        console.log(`🔗 Подключаюсь к ${TV_IP}:${ADB_PORT}...`);
        const result = await this.adbCommand(`connect ${TV_IP}:${ADB_PORT}`);
        
        if (result.success) {
            const devices = await this.adbCommand('devices');
            if (devices.success && devices.output.includes(TV_IP)) {
                this.connected = true;
                this.lastError = null;
                console.log(`✅ Подключено к ${TV_IP}`);
                return true;
            }
        }
        
        this.connected = false;
        this.lastError = result.output;
        return false;
    }

    async ensureConnected() {
        if (this.connected) {
            const test = await this.adbCommand('shell echo 1');
            if (test.success) {
                return true;
            }
            this.connected = false;
        }
        
        if (this.connectionPromise) {
            return await this.connectionPromise;
        }
        
        this.connectionPromise = this.connect();
        const result = await this.connectionPromise;
        this.connectionPromise = null;
        return result;
    }

    // Автоматическое подключение при запуске
    async init() {
        console.log('🚀 Инициализация ADB Remote...');
        const connected = await this.connect();
        if (connected) {
            console.log('✅ ADB Remote готов к работе');
        } else {
            console.log('⚠️ ADB Remote: подключение не удалось, будет повторно при первом вызове');
        }
        return connected;
    }

    async sendKey(keyCode) {
        const connected = await this.ensureConnected();
        if (!connected) {
            return { 
                success: false, 
                message: `Не удалось подключиться к ${TV_IP}:${ADB_PORT}`,
                error: this.lastError
            };
        }
        
        console.log(`📤 Код клавиши: ${keyCode}`);
        return await this.adbCommand(`shell input keyevent ${keyCode}`);
    }

    async home() { return await this.sendKey(3); }
    async back() { return await this.sendKey(4); }
    async up() { return await this.sendKey(19); }
    async down() { return await this.sendKey(20); }
    async left() { return await this.sendKey(21); }
    async right() { return await this.sendKey(22); }
    async enter() { return await this.sendKey(66); }
    async power() { return await this.sendKey(26); }
    async volumeUp() { return await this.sendKey(24); }
    async volumeDown() { return await this.sendKey(25); }
    async mute() { return await this.sendKey(164); }
    async menu() { return await this.sendKey(82); }
    async settings() { return await this.sendKey(176); }
    async search() { return await this.sendKey(84); }

    async launchApp(packageName) {
        const connected = await this.ensureConnected();
        if (!connected) {
            return { success: false, message: 'Не удалось подключиться к устройству' };
        }
        
        console.log(`🚀 Запуск: ${packageName}`);
        this.currentApp = packageName;
        return await this.adbCommand(`shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
    }

    async closeApp(packageName) {
        const connected = await this.ensureConnected();
        if (!connected) {
            return { success: false, message: 'Не удалось подключиться к устройству' };
        }
        
        console.log(`⛔ Закрытие: ${packageName}`);
        return await this.adbCommand(`shell am force-stop ${packageName}`);
    }

    async getCurrentApp() {
        const connected = await this.ensureConnected();
        if (!connected) {
            return { success: false, message: 'Не удалось подключиться к устройству' };
        }
        
        const result = await this.adbCommand(`shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'`);
        if (result.success && result.output) {
            const match = result.output.match(/[a-zA-Z0-9_\.]+(?=\/)/);
            if (match) {
                return { success: true, package: match[0] };
            }
        }
        return { success: false, message: 'Не удалось определить текущее приложение' };
    }

    async getInstalledApps() {
        const connected = await this.ensureConnected();
        if (!connected) {
            return { success: false, message: 'Не удалось подключиться к устройству' };
        }
        
        const result = await this.adbCommand(`shell pm list packages -3`);
        if (result.success) {
            const packages = result.output.split('\n')
                .filter(line => line.startsWith('package:'))
                .map(line => line.replace('package:', '').trim());
            return { success: true, packages };
        }
        return { success: false, message: 'Не удалось получить список приложений' };
    }

    async getDeviceInfo() {
        const connected = await this.ensureConnected();
        if (!connected) {
            return { success: false, message: 'Не удалось подключиться к устройству' };
        }
        
        const model = await this.adbCommand(`shell getprop ro.product.model`);
        const version = await this.adbCommand(`shell getprop ro.build.version.release`);
        const battery = await this.adbCommand(`shell dumpsys battery | grep level`);
        
        return {
            success: true,
            info: {
                model: model.success ? model.output : 'unknown',
                androidVersion: version.success ? version.output : 'unknown',
                batteryLevel: battery.success ? battery.output.match(/\d+/)?.[0] : 'unknown'
            }
        };
    }

    async getStatus() {
        const devices = await this.adbCommand('devices');
        if (devices.success && devices.output.includes(TV_IP)) {
            this.connected = true;
            return { connected: true, ip: TV_IP };
        }
        this.connected = false;
        return { connected: false, ip: TV_IP };
    }
}

module.exports = new ADBRemote();