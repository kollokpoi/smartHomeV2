// services/iconService.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ICONS_DIR = path.join(__dirname, '../uploads/icons');
const DEFAULT_ICONS = {
  light: '/icons/defaults/lightbulb.svg',
  outlet: '/icons/defaults/outlet.svg',
  projector: '/icons/defaults/projector.svg',
  tv: '/icons/defaults/tv.svg',
  speaker: '/icons/defaults/speaker.svg',
  thermostat: '/icons/defaults/thermostat.svg',
  camera: '/icons/defaults/camera.svg',
  gateway: '/icons/defaults/gateway.svg',
  sensor: '/icons/defaults/sensor.svg',
  default: '/icons/defaults/default-device.svg'
};

// Создаем папку если нет
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

class IconService {
  // Сохранение иконки
  async saveIcon(file) {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(ICONS_DIR, filename);
    
    fs.writeFileSync(filepath, file.buffer);
    
    return `/uploads/icons/${filename}`;
  }
  
  // Удаление иконки
  async deleteIcon(iconPath) {
    if (!iconPath || iconPath.startsWith('/icons/defaults/')) {
      return; // не удаляем дефолтные
    }
    
    const fullPath = path.join(__dirname, '../..', iconPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
  
  // Получить дефолтную иконку по типу/названию
  getDefaultIcon(deviceName, deviceType = null) {
    const name = deviceName?.toLowerCase() || '';
    
    if (name.includes('лампа') || name.includes('light')) {
      return DEFAULT_ICONS.light;
    }
    if (name.includes('розетка') || name.includes('socket') || name.includes('outlet')) {
      return DEFAULT_ICONS.outlet;
    }
    if (name.includes('проектор') || name.includes('projector')) {
      return DEFAULT_ICONS.projector;
    }
    if (name.includes('телевизор') || name.includes('tv')) {
      return DEFAULT_ICONS.tv;
    }
    if (name.includes('колонка') || name.includes('speaker')) {
      return DEFAULT_ICONS.speaker;
    }
    if (name.includes('термостат') || name.includes('thermostat')) {
      return DEFAULT_ICONS.thermostat;
    }
    if (name.includes('камера') || name.includes('camera')) {
      return DEFAULT_ICONS.camera;
    }
    if (name.includes('шлюз') || name.includes('gateway')) {
      return DEFAULT_ICONS.gateway;
    }
    if (name.includes('датчик') || name.includes('sensor')) {
      return DEFAULT_ICONS.sensor;
    }
    
    return DEFAULT_ICONS.default;
  }
}

module.exports = new IconService();