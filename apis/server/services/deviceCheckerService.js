// services/deviceCheckerService.js
const ping = require("ping");
const { Device } = require("../src/models");
const logger = require("../src/utils/logger");

class DeviceChecker {
  constructor() {
    this.interval = null;
    this.isRunning = false;
    this.checkPeriod = parseInt(process.env.DEVICE_CHECK_PERIOD || "30000", 10);
  }

  /**
   * Запуск периодической проверки устройств
   */
  async start() {
    if (this.isRunning) {
      logger.warn("Device checker is already running");
      return;
    }

    this.isRunning = true;
    logger.info(`Device checker started with interval ${this.checkPeriod}ms`);

    // Запускаем первый чек сразу
    await this.checkAllDevices();

    // Запускаем интервал
    this.interval = setInterval(async () => {
      await this.checkAllDevices();
    }, this.checkPeriod);
  }

  /**
   * Остановка проверки
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info("Device checker stopped");
  }

  /**
   * Проверка всех активных устройств
   */
  async checkAllDevices() {
    try {
      const devices = await Device.findAll({
        where: {
          is_active: true,
        },
        attributes: ["id", "ip", "name", "status", "last_seen"],
      });

      if (devices.length === 0) {
        return;
      }

      logger.debug(`Checking ${devices.length} devices...`);

      const results = await Promise.allSettled(
        devices.map((device) => this.checkDevice(device)),
      );

      const successCount = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      const failedCount = results.filter((r) => r.status === "rejected").length;

      if (failedCount > 0) {
        logger.warn(
          `Device check completed: ${successCount} success, ${failedCount} failed`,
        );
      }
    } catch (error) {
      logger.error("Error checking devices:", error);
    }
  }

  /**
   * Проверка конкретного устройства
   */
  async checkDevice(device) {
    try {
      const result = await this.pingDevice(device.ip);

      const newStatus = result.alive ? "online" : "offline";
      const oldStatus = device.status;

      // Обновляем статус только если он изменился
      if (newStatus !== oldStatus) {
        await device.update({
          status: newStatus,
          last_seen: result.alive ? new Date() : device.last_seen,
        });

        logger.info(
          `Device ${device.name} (${device.ip}) status changed: ${oldStatus} -> ${newStatus}`,
        );
      } else if (result.alive) {
        // Если устройство онлайн, обновляем last_seen
        await device.update({
          last_seen: new Date(),
        });
      }

      return result.alive;
    } catch (error) {
      logger.error(
        `Error checking device ${device.name} (${device.ip}):`,
        error,
      );

      // При ошибке помечаем как offline
      if (device.status !== "offline") {
        await device.update({
          status: "offline",
        });
      }

      return false;
    }
  }

  /**
   * Ping конкретного устройства
   */
  async pingDevice(ip) {
    try {
      const result = await ping.promise.probe(ip, {
        timeout: parseInt(process.env.PING_TIMEOUT || "5", 10),
        extra: ["-n", "1"], // для Windows вместо -c
      });

      return {
        alive: result.alive,
        time: result.time,
      };
    } catch (error) {
      return { alive: false };
    }
  }

  /**
   * Принудительная проверка конкретного устройства по ID
   */
  async checkDeviceById(deviceId) {
    try {
      const device = await Device.findByPk(deviceId);
      if (!device) {
        throw new Error(`Device with id ${deviceId} not found`);
      }
      return await this.checkDevice(device);
    } catch (error) {
      logger.error(`Error checking device by id ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Проверка всех устройств на конкретном IP
   */
  async checkDevicesByIp(ip) {
    try {
      const devices = await Device.findAll({
        where: {
          ip,
          is_active: true,
        },
      });

      await Promise.all(devices.map((device) => this.checkDevice(device)));
    } catch (error) {
      logger.error(`Error checking devices by IP ${ip}:`, error);
    }
  }

  /**
   * Получение статистики по устройствам
   */
  async getStats() {
    const devices = await Device.findAll({
      where: { is_active: true },
      attributes: ["status"],
    });

    const online = devices.filter((d) => d.status === "online").length;
    const offline = devices.filter((d) => d.status === "offline").length;

    return {
      total: devices.length,
      online,
      offline,
      lastCheck: new Date(),
    };
  }
}

module.exports = new DeviceChecker();
