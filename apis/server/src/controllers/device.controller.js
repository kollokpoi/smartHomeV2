const { Device, Action, ActionParameter, VoiceCommand, sequelize } = require("../models");
const { deviceValidator } = require("../helpers/validators");
const PaginationHelper = require('../helpers/paginationHelper');
const { Op } = require('sequelize');

class DeviceController {
  async getAll(req, res, next) {
    try {
      const { page, limit, offset, sortBy, sortOrder, filters } =
        PaginationHelper.getPaginationParams(req.query);

      const {
        search,
        status,
        isActive,
        minLastSeen,
        maxLastSeen,
        ip,
        metadata,
      } = filters;

      const where = {};

      // Фильтр по статусу
      if (status) {
        where.status = status;
      }

      // Фильтр по активности
      if (isActive !== undefined) {
        where.is_active = isActive === "true";
      }

      // Фильтр по IP
      if (ip) {
        where.ip = { [Op.like]: `%${ip}%` };
      }

      // Фильтр по дате последнего подключения
      if (minLastSeen || maxLastSeen) {
        where.last_seen = {};
        if (minLastSeen) {
          where.last_seen[Op.gte] = new Date(minLastSeen);
        }
        if (maxLastSeen) {
          where.last_seen[Op.lte] = new Date(maxLastSeen);
        }
      }

      // Фильтр по метаданным (JSON поиск)
      if (metadata) {
        try {
          const metadataFilter = JSON.parse(metadata);
          where.metadata = metadataFilter;
        } catch {
          // Если не JSON, ищем как строку
          where.metadata = { [Op.like]: `%${metadata}%` };
        }
      }

      // Поиск по тексту
      if (search) {
        const searchFields = [
          'name','ip','description','handler_path'
        ]
        where[Op.or] = PaginationHelper.createSearchCondition(search,searchFields,Op);
      }

      // Разрешенные поля для сортировки
      const allowedSortFields = [
        "name",
        "ip",
        "status",
        "createdAt",
        "updatedAt",
        "lastSeen",
        "sortOrder",
      ];
      const order = PaginationHelper.getSortingParams(
        sortBy,
        sortOrder,
        allowedSortFields,
      );

      const { count, rows } = await Device.findAndCountAll({
        where,
        order,
        limit,
        offset,
        distinct: true,
      });

      // Получаем статистику по действиям для каждого устройства
      const devicesWithStats = await Promise.all(
        rows.map(async (device) => {
          const deviceJson = device.toJSON();

          const actionsCount = await Action.count({
            where: { device_id: device.id },
          });

          const activeCommandsCount = await VoiceCommand.count({
            include: [
              {
                model: Action,
                as: "action",
                where: { device_id: device.id },
                required: true,
              },
            ],
            where: { is_active: true },
          });

          return {
            ...deviceJson,
            stats: {
              actionsCount,
              activeCommandsCount,
            },
          };
        }),
      );

      res.json({
        success: true,
        data: devicesWithStats,
        pagination: PaginationHelper.getPaginationResponse(count, page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    const transaction = await Device.sequelize.transaction();

    try {
      const errors =  deviceValidator.validate(req.body);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors,
        });
      }

      const device = await Device.create(req.body, { transaction });
      await transaction.commit();

      res.status(201).json({
        success: true,
        data: device,
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Получение устройства по ID
  async getById(req, res, next) {
    try {
      const device = await Device.findByPk(req.params.id, {
        include: [
          {
            model: Action,
            as: "actions",
            include: [
              { model: ActionParameter, as: "parameters" },
              { model: VoiceCommand, as: "voiceCommands" },
            ],
          },
        ],
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Устройство не найдено",
        });
      }

      res.json({
        success: true,
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  // Обновление устройства
  async update(req, res, next) {
    const transaction = await Device.sequelize.transaction();

    try {
      const device = await Device.findByPk(req.params.id, { transaction });

      if (!device) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Устройство не найдено",
        });
      }

      const errors = deviceValidator.validate(req.body);
      if (errors.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          errors,
        });
      }

      await device.update(req.body, { transaction });
      await transaction.commit();

      res.json({
        success: true,
        data: device,
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Удаление устройства
  async delete(req, res, next) {
    const transaction = await Device.sequelize.transaction();

    try {
      const device = await Device.findByPk(req.params.id, { transaction });

      if (!device) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Устройство не найдено",
        });
      }

      await device.destroy({ transaction });
      await transaction.commit();

      res.json({
        success: true,
        message: "Устройство удалено",
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Получение статистики
  async getStats(req, res, next) {
    try {
      const stats = await Device.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Обновление статуса
  async updateStatus(req, res, next) {
    try {
      const device = await Device.findByPk(req.params.id);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Устройство не найдено",
        });
      }

      await device.update({
        status: req.body.status,
        lastSeen: req.body.status === "online" ? new Date() : device.lastSeen,
      });

      res.json({
        success: true,
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeviceController();
