/**
 * WebSocket Service - централизованная обработка WebSocket подключений
 * Вынесена из index.js для устранения дублирования и улучшения архитектуры
 */

const logger = require('../utils/logger');

class WebSocketService {
  constructor(io) {
    this.io = io;
    this.devices = new Map();
    this.clients = new Map();
    this.subscriptions = new Map();
    this.clientSubscriptions = new Map();
    
    // Интервал для очистки устаревших данных (каждые 5 минут)
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Очистка устаревших данных для предотвращения утечек памяти
   */
  cleanup() {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 минут

    // Очистка оффлайн устройств
    for (const [deviceId, device] of this.devices) {
      if (device.status === 'offline' && (now - device.lastSeen.getTime()) > staleThreshold) {
        this.removeDevice(deviceId);
      }
    }

    logger.info('WebSocket cleanup completed', { 
      devicesCount: this.devices.size,
      clientsCount: this.clients.size,
      subscriptionsCount: this.subscriptions.size
    });
  }

  /**
   * Инициализация обработчиков событий
   */
  initialize() {
    this.io.on('connection', (socket) => {
      logger.info(`Новое подключение: ${socket.id}`);

      this.setupDeviceHandlers(socket);
      this.setupClientHandlers(socket);
      this.setupDataHandlers(socket);
      this.setupCommandHandlers(socket);
      this.setupDisconnectHandler(socket);
    });

    return this;
  }

  /**
   * Обработчики для устройств
   */
  setupDeviceHandlers(socket) {
    socket.on('register-device', async (data) => {
      try {
        const ipv4 = socket.request.socket.remoteAddress;
        const cleanIp = ipv4?.replace('::ffff:', '');
        const { port, category, commands } = data;

        // Валидация входных данных
        if (!port || !category || !Array.isArray(commands)) {
          socket.emit('device-registered', {
            status: 'error',
            message: 'Некорректные данные регистрации: требуются port, category и commands'
          });
          return;
        }

        const Device = require('../models').Device;
        const device = await Device.findOne({ where: { ip: cleanIp, port } });

        if (!device) {
          socket.emit('device-registered', {
            status: 'error',
            message: 'Устройство не найдено в базе данных'
          });
          return;
        }

        const deviceId = device.id;

        this.devices.set(deviceId, {
          id: deviceId,
          name: device.name,
          category: category,
          commands: commands,
          status: 'online',
          socketId: socket.id,
          connectedAt: new Date(),
          lastSeen: new Date(),
          lastData: null,
          lastDataTimestamp: null,
          data: [],
        });

        socket.deviceId = deviceId;

        logger.info(`Устройство зарегистрировано: ID=${deviceId}, IP=${cleanIp}:${port}`);

        this.broadcastDevicesList();

        socket.emit('device-registered', {
          status: 'ok',
          deviceId: deviceId,
          category: category,
          message: 'Устройство успешно зарегистрировано',
        });
      } catch (error) {
        logger.error('Ошибка регистрации устройства:', { error: error.message, stack: error.stack });
        socket.emit('device-registered', {
          status: 'error',
          message: 'Ошибка при регистрации устройства'
        });
      }
    });
  }

  /**
   * Обработчики для клиентов
   */
  setupClientHandlers(socket) {
    socket.on('register-client', (data) => {
      try {
        const { clientId, name } = data;

        if (!clientId) {
          socket.emit('error', { message: 'clientId обязателен' });
          return;
        }

        this.clients.set(clientId, {
          id: clientId,
          socketId: socket.id,
          connectedAt: new Date(),
          subscriptions: new Set(),
        });
        
        socket.clientId = clientId;

        logger.info(`Клиент зарегистрирован: ${clientId} (${name || 'unnamed'})`);

        this.sendDevicesByCategory(socket);
        this.sendDevicesCommands(socket);
      } catch (error) {
        logger.error('Ошибка регистрации клиента:', { error: error.message });
        socket.emit('error', { message: 'Ошибка при регистрации клиента' });
      }
    });

    socket.on('subscribe-devices', (data) => {
      try {
        const { deviceIds, clientId } = data;

        if (!Array.isArray(deviceIds)) {
          socket.emit('error', { message: 'deviceIds должен быть массивом' });
          return;
        }

        const results = [];

        for (const deviceId of deviceIds) {
          const device = this.devices.get(deviceId);
          if (!device) {
            results.push({
              deviceId: deviceId,
              status: 'error',
              message: `Устройство ${deviceId} не найдено`,
              data: [],
            });
            continue;
          }

          if (!this.subscriptions.has(deviceId)) {
            this.subscriptions.set(deviceId, new Set());
          }
          this.subscriptions.get(deviceId).add(socket.id);

          if (!this.clientSubscriptions.has(clientId)) {
            this.clientSubscriptions.set(clientId, new Set());
          }
          this.clientSubscriptions.get(clientId).add(deviceId);

          const client = this.clients.get(clientId);
          if (client) {
            client.subscriptions.add(deviceId);
            this.clients.set(clientId, client);
          }

          results.push({
            deviceId: deviceId,
            status: 'ok',
            category: device.category,
            name: device.name,
          });

          logger.info(`Клиент ${clientId} подписался на устройство ${deviceId} (${device.category})`);

          if (device.lastData) {
            socket.emit('device-data', {
              deviceId: deviceId,
              category: device.category,
              data: device.lastData,
              timestamp: device.lastDataTimestamp,
            });
          }
        }

        socket.emit('subscribed', { results });
        this.sendClientSubscriptions(socket, clientId);
      } catch (error) {
        logger.error('Ошибка подписки на устройства:', { error: error.message });
        socket.emit('error', { message: 'Ошибка при подписке на устройства' });
      }
    });

    socket.on('subscribe-by-category', (data) => {
      try {
        const { categories, clientId } = data;

        const categoriesArray = Array.isArray(categories) ? categories : [categories];
        const deviceIds = [];

        for (const [deviceId, device] of this.devices) {
          if (categoriesArray.includes(device.category)) {
            deviceIds.push(deviceId);
          }
        }

        if (deviceIds.length > 0) {
          socket.emit('subscribe-devices', { deviceIds, clientId });
        } else {
          socket.emit('error', {
            message: `Нет устройств в категориях: ${categoriesArray.join(', ')}`,
          });
        }
      } catch (error) {
        logger.error('Ошибка подписки по категории:', { error: error.message });
        socket.emit('error', { message: 'Ошибка при подписке по категории' });
      }
    });

    socket.on('unsubscribe-devices', (data) => {
      try {
        const { deviceIds, clientId } = data;

        const deviceIdsArray = Array.isArray(deviceIds) ? deviceIds : [deviceIds];

        for (const deviceId of deviceIdsArray) {
          if (this.subscriptions.has(deviceId)) {
            this.subscriptions.get(deviceId).delete(socket.id);
            if (this.subscriptions.get(deviceId).size === 0) {
              this.subscriptions.delete(deviceId);
            }
          }

          if (this.clientSubscriptions.has(clientId)) {
            this.clientSubscriptions.get(clientId).delete(deviceId);
          }

          const client = this.clients.get(clientId);
          if (client) {
            client.subscriptions.delete(deviceId);
            this.clients.set(clientId, client);
          }

          logger.info(`Клиент ${clientId} отписался от устройства ${deviceId}`);
        }

        socket.emit('unsubscribed', { deviceIds: deviceIdsArray });
        this.sendClientSubscriptions(socket, clientId);
      } catch (error) {
        logger.error('Ошибка отписки от устройств:', { error: error.message });
        socket.emit('error', { message: 'Ошибка при отписке от устройств' });
      }
    });
  }

  /**
   * Обработчики данных телеметрии
   */
  setupDataHandlers(socket) {
    socket.on('device-data', (data) => {
      try {
        const { deviceId, telemetry, timestamp = Date.now() } = data;

        const device = this.devices.get(deviceId);
        if (!device) {
          logger.warn(`Неизвестное устройство ${deviceId} пытается отправить данные`);
          return;
        }

        device.lastData = telemetry;
        device.lastDataTimestamp = timestamp;
        device.lastSeen = new Date();
        this.devices.set(deviceId, device);

        const subscribers = this.subscriptions.get(deviceId);
        if (subscribers && subscribers.size > 0) {
          const messageData = {
            deviceId: deviceId,
            category: device.category,
            name: device.name,
            data: telemetry,
            timestamp: timestamp,
          };

          for (const subscriberId of subscribers) {
            this.io.to(subscriberId).emit('device-data', messageData);
          }
        }
      } catch (error) {
        logger.error('Ошибка обработки данных устройства:', { error: error.message });
      }
    });

    socket.on('device-status', (data) => {
      try {
        const { deviceId, status } = data;

        const device = this.devices.get(deviceId);
        if (device) {
          device.status = status;
          device.lastSeen = new Date();
          this.devices.set(deviceId, device);

          logger.info(`Статус устройства ${deviceId}: ${status}`);

          const subscribers = this.subscriptions.get(deviceId);
          if (subscribers) {
            const statusData = {
              deviceId: deviceId,
              category: device.category,
              status: status,
              timestamp: Date.now(),
            };

            for (const subscriberId of subscribers) {
              this.io.to(subscriberId).emit('device-status-update', statusData);
            }
          }

          this.broadcastDevicesList();
        }
      } catch (error) {
        logger.error('Ошибка обновления статуса устройства:', { error: error.message });
      }
    });
  }

  /**
   * Обработчики команд
   */
  setupCommandHandlers(socket) {
    socket.on('send-command', async (data) => {
      try {
        const { deviceId, command, params, clientId } = data;

        const device = this.devices.get(deviceId);
        if (!device) {
          socket.emit('command-response', {
            deviceId: deviceId,
            command: command,
            status: 'error',
            message: `Устройство ${deviceId} не найдено`,
          });
          return;
        }

        const client = this.clients.get(clientId);
        // Исправлена инвертированная логика: проверяем отсутствие клиента
        if (!client) {
          socket.emit('command-response', {
            deviceId: deviceId,
            command: command,
            status: 'error',
            message: 'У вас нет прав на управление устройствами',
          });
          return;
        }

        if (!device.commands.includes(command)) {
          socket.emit('command-response', {
            deviceId: deviceId,
            command: command,
            status: 'error',
            message: `Команда ${command} не поддерживается устройством ${device.category}`,
          });
          return;
        }

        if (device.status !== 'online') {
          socket.emit('command-response', {
            deviceId: deviceId,
            command: command,
            status: 'error',
            message: `Устройство ${deviceId} оффлайн`,
          });
          return;
        }

        logger.info(`Команда от ${clientId} на ${deviceId} (${device.category}): ${command}`, params);

        const deviceSocket = this.io.sockets.sockets.get(device.socketId);
        if (deviceSocket) {
          deviceSocket.emit('command', {
            command: command,
            params: params || {},
            from: clientId,
            timestamp: Date.now(),
          });
        } else {
          socket.emit('command-response', {
            deviceId: deviceId,
            command: command,
            status: 'error',
            message: 'Устройство недоступно',
          });
        }
      } catch (error) {
        logger.error('Ошибка отправки команды:', { error: error.message });
        socket.emit('command-response', {
          status: 'error',
          message: 'Ошибка при отправке команды'
        });
      }
    });

    socket.on('command-result', (data) => {
      try {
        const { deviceId, command, result, status, error } = data;

        logger.info(`Ответ от ${deviceId} на команду ${command}:`, result || error);

        const subscribers = this.subscriptions.get(deviceId);
        if (subscribers) {
          const responseData = {
            deviceId: deviceId,
            command: command,
            status: status || (result ? 'success' : 'error'),
            result: result,
            error: error,
            timestamp: Date.now(),
          };

          for (const subscriberId of subscribers) {
            this.io.to(subscriberId).emit('command-response', responseData);
          }
        }
      } catch (error) {
        logger.error('Ошибка обработки результата команды:', { error: error.message });
      }
    });
  }

  /**
   * Обработчик отключения
   */
  setupDisconnectHandler(socket) {
    socket.on('disconnect', () => {
      try {
        if (socket.deviceId) {
          const device = this.devices.get(socket.deviceId);
          if (device) {
            device.status = 'offline';
            this.devices.set(socket.deviceId, device);

            logger.info(`Устройство отключилось: ${socket.deviceId}`);

            const subscribers = this.subscriptions.get(socket.deviceId);
            if (subscribers) {
              const statusData = {
                deviceId: socket.deviceId,
                category: device.category,
                status: 'offline',
                timestamp: Date.now(),
              };

              for (const subscriberId of subscribers) {
                this.io.to(subscriberId).emit('device-status-update', statusData);
              }
            }

            this.broadcastDevicesList();
          }
        } else if (socket.clientId) {
          logger.info(`Клиент отключился: ${socket.clientId}`);

          const client = this.clients.get(socket.clientId);
          if (client) {
            for (const deviceId of client.subscriptions) {
              if (this.subscriptions.has(deviceId)) {
                this.subscriptions.get(deviceId).delete(socket.id);
                if (this.subscriptions.get(deviceId).size === 0) {
                  this.subscriptions.delete(deviceId);
                }
              }
            }
            this.clients.delete(socket.clientId);
            this.clientSubscriptions.delete(socket.clientId);
          }
        }
      } catch (error) {
        logger.error('Ошибка при отключении:', { error: error.message });
      }
    });
  }

  /**
   * Удаление устройства
   */
  removeDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (device) {
      // Удаляем подписки
      if (this.subscriptions.has(deviceId)) {
        this.subscriptions.delete(deviceId);
      }

      // Удаляем из подписок клиентов
      for (const [clientId, client] of this.clients) {
        client.subscriptions.delete(deviceId);
      }

      this.devices.delete(deviceId);
      logger.info(`Устройство ${deviceId} удалено из памяти`);
    }
  }

  /**
   * Трансляция списка устройств
   */
  broadcastDevicesList() {
    const devicesList = this.getDevicesList();
    this.io.emit('devices-list-update', devicesList);
  }

  /**
   * Получение списка устройств
   */
  getDevicesList() {
    const devicesByCategory = [];

    for (const [id, device] of this.devices) {
      devicesByCategory.push({
        id: device.id,
        name: device.name,
        category: device.category,
        status: device.status,
        lastSeen: device.lastSeen,
      });
    }

    return devicesByCategory;
  }

  /**
   * Отправка устройств по категориям
   */
  sendDevicesByCategory(socket) {
    const devicesByCategory = this.getDevicesList();
    socket.emit('devices-by-category', devicesByCategory);
  }

  /**
   * Отправка команд устройств
   */
  sendDevicesCommands(socket) {
    const devicesCommands = {};

    for (const [deviceId, device] of this.devices) {
      devicesCommands[deviceId] = {
        id: device.id,
        name: device.name,
        category: device.category,
        commands: device.commands,
        status: device.status,
      };
    }

    socket.emit('devices-commands', devicesCommands);
  }

  /**
   * Отправка подписок клиента
   */
  sendClientSubscriptions(socket, clientId) {
    const subscriptions = this.clientSubscriptions.get(clientId) || new Set();
    socket.emit('my-subscriptions', Array.from(subscriptions));
  }

  /**
   * Остановка сервиса и очистка ресурсов
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.devices.clear();
    this.clients.clear();
    this.subscriptions.clear();
    this.clientSubscriptions.clear();
    
    logger.info('WebSocket service stopped');
  }

  /**
   * Получение статистики
   */
  getStats() {
    return {
      devicesCount: this.devices.size,
      clientsCount: this.clients.size,
      subscriptionsCount: this.subscriptions.size,
      clientSubscriptionsCount: this.clientSubscriptions.size,
    };
  }
}

module.exports = WebSocketService;
