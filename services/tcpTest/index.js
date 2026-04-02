// device-camera.js (эмулятор камеры)
const io = require('socket.io-client');
const socket = io('http://localhost:3333');

const deviceId = 'camera_' + Math.random().toString(36).substr(2, 6);

// Регистрируем устройство как камеру
socket.emit('register-device', {
    deviceId: deviceId,
    deviceType: 'ip_camera',
    category: 'camera',
    commands: [
        'start_stream',
        'stop_stream',
        'take_photo',
        'set_resolution',
        'move_ptz'
    ],
    metadata: {
        resolution: '1920x1080',
        fps: 30,
        location: 'Вход',
        ptz: true
    }
});

socket.on('device-registered', (data) => {
    console.log('✅ Устройство зарегистрировано:', data);
    
    // Эмулируем отправку данных (кадров)
    let frameCount = 0;
    setInterval(() => {
        if (socket.connected) {
            const frame = {
                deviceId: deviceId,
                telemetry: {
                    frame: frameCount++,
                    timestamp: Date.now(),
                    motion_detected: Math.random() > 0.8,
                    resolution: '1920x1080',
                    fps: 30,
                    thumbnail: `frame_${frameCount}.jpg`
                }
            };
            
            socket.emit('device-data', frame);
            console.log(`📸 Отправлен кадр #${frameCount}`);
        }
    }, 2000); 
});

socket.on('command', (data) => {
    console.log(`🎮 Получена команда: ${data.command}`, data.params);
    
    // Обработка команд
    let result;
    switch(data.command) {
        case 'start_stream':
            result = { status: 'streaming', url: `rtsp://camera/${deviceId}/stream` };
            break;
        case 'stop_stream':
            result = { status: 'stopped' };
            break;
        case 'take_photo':
            result = { photo_url: `/photos/${deviceId}_${Date.now()}.jpg` };
            break;
        case 'move_ptz':
            result = { moved: true, direction: data.params.direction };
            break;
        default:
            result = { received: true };
    }
    
    socket.emit('command-result', {
        deviceId: deviceId,
        command: data.command,
        status: 'success',
        result: result
    });
});

socket.on('connect', () => {
    console.log('🔌 Подключено к серверу');
});

socket.on('disconnect', () => {
    console.log('🔌 Отключено от сервера');
});