// controllers/actionController.js
const { Action, ActionParameter, VoiceCommand, Device } = require("../models");
const {
  actionValidator,
  parameterValidator,
} = require("../helpers/validators");
const axios = require("axios");
const PaginationHelper = require("../helpers/paginationHelper");
const { Op } = require("sequelize");

class ActionController {
  async getAll(req, res, next) {
    try {
      const { page, limit, offset, sortBy, sortOrder, filters } =
        PaginationHelper.getPaginationParams(req.query);

      const {
        search,
        deviceId,
        method,
        isActive,
        minTimeout,
        maxTimeout,
        minCallCount,
        lastCallFrom,
        lastCallTo,
        hasError,
      } = filters;

      const where = {};

      // Фильтр по устройству
      if (deviceId) {
        where.device_id = deviceId;
      }

      // Фильтр по методу
      if (method) {
        where.method = method;
      }

      // Фильтр по активности
      if (isActive !== undefined) {
        where.is_active = isActive === "true";
      }

      // Фильтр по таймауту
      if (minTimeout || maxTimeout) {
        where.timeout = {};
        if (minTimeout) where.timeout[Op.gte] = parseInt(minTimeout);
        if (maxTimeout) where.timeout[Op.lte] = parseInt(maxTimeout);
      }

      // Фильтр по количеству вызовов
      if (minCallCount !== undefined) {
        where.call_count = { [Op.gte]: parseInt(minCallCount) };
      }

      // Фильтр по дате последнего вызова
      if (lastCallFrom || lastCallTo) {
        where.last_call = {};
        if (lastCallFrom) where.last_call[Op.gte] = new Date(lastCallFrom);
        if (lastCallTo) where.last_call[Op.lte] = new Date(lastCallTo);
      }

      // Фильтр по наличию ошибок
      if (hasError !== undefined) {
        if (hasError === "true") {
          where.last_error = { [Op.ne]: null };
        } else {
          where.last_error = null;
        }
      }

      // Поиск по тексту
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { path: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ];
      }

      // Разрешенные поля для сортировки
      const allowedSortFields = [
        "name",
        "method",
        "path",
        "port",
        "timeout",
        "callCount",
        "lastCall",
        "createdAt",
        "sortOrder",
      ];
      const order = PaginationHelper.getSortingParams(
        sortBy,
        sortOrder,
        allowedSortFields,
      );

      const { count, rows } = await Action.findAndCountAll({
        where,
        include: [
          {
            model: Device,
            as: "device",
            attributes: ["id", "name", "ip", "status"],
          },
        ],
        order,
        limit,
        offset,
        distinct: true,
      });

      const actionsWithStats = await Promise.all(
        rows.map(async (action) => {
          const actionJson = action.toJSON();

          const [parametersCount, voiceCommandsCount] = await Promise.all([
            ActionParameter.count({ where: { action_id: action.id } }),
            VoiceCommand.count({
              where: { action_id: action.id, is_active: true },
            }),
          ]);

          return {
            ...actionJson,
            stats: {
              parametersCount,
              voiceCommandsCount,
              successRate:
                action.call_count > 0
                  ? (
                      ((action.call_count - (action.last_error ? 1 : 0)) /
                        action.call_count) *
                      100
                    ).toFixed(2)
                  : 0,
            },
          };
        }),
      );

      res.json({
        success: true,
        data: actionsWithStats,
        pagination: PaginationHelper.getPaginationResponse(count, page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    const transaction = await Action.sequelize.transaction();

    try {
      // ВАЛИДАЦИЯ - ПРОВЕРЯЕМ ДАННЫЕ
      const errors = actionValidator.validate(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      // Проверка существования устройства
      const device = await Device.findByPk(req.body.deviceId);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Устройство не найдено",
        });
      }

      // Проверка уникальности имени для этого устройства
      const existing = await Action.findOne({
        where: {
          device_id: req.body.deviceId,
          name: req.body.name,
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          errors: [
            {
              field: "name",
              message:
                "Действие с таким названием уже существует у этого устройства",
            },
          ],
        });
      }

      const action = await Action.create(req.body, { transaction });
      await transaction.commit();

      res.status(201).json({ success: true, data: action });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Получение действий устройства
  async getByDevice(req, res, next) {
    try {
      const actions = await Action.findAll({
        where: { deviceId: req.params.deviceId },
        include: [
          { association: "parameters" },
          { association: "voiceCommands" },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json({
        success: true,
        data: actions,
      });
    } catch (error) {
      next(error);
    }
  }

  // Получение действия по ID
  async getById(req, res, next) {
    try {
      const action = await Action.findByPk(req.params.id, {
        include: [
          { association: "device" },
          { association: "parameters" },
          { association: "voiceCommands" },
        ],
      });

      if (!action) {
        return res.status(404).json({
          success: false,
          message: "Действие не найдено",
        });
      }

      res.json({
        success: true,
        data: action,
      });
    } catch (error) {
      next(error);
    }
  }

  async execute(req, res, next) {
    try {
      // Загружаем действие со всеми его параметрами
      const action = await Action.findByPk(req.params.id, {
        include: [
          {
            association: "device",
            required: true,
          },
          {
            association: "parameters",
            where: { is_active: true },
            required: false,
          },
        ],
      });

      if (!action) {
        return res.status(404).json({
          success: false,
          message: "Действие не найдено",
        });
      }

      const device = action.device;
      if (device.status === "offline") {
        return res.status(503).json({
          success: false,
          message: "Устройство офлайн",
        });
      }

      // Формируем URL
      let url = `http://${device.ip}:${action.port}${action.path}`;

      // Подготавливаем параметры ИЗ ActionParameter
      const requestParams = {
        query: {},
        headers: {},
        body: null,
      };

      // Заполняем параметры из БД (ActionParameter)
      for (const param of action.parameters) {
        let value = param.value; // Берем значение из БД

        if (value !== null && value !== undefined) {
          // Преобразуем тип
          switch (param.type) {
            case "number":
              value = Number(value);
              break;
            case "boolean":
              value = value === "true" || value === true;
              break;
            case "json":
              value = typeof value === "string" ? JSON.parse(value) : value;
              break;
            case "array":
              value = Array.isArray(value) ? value : [value];
              break;
          }

          // Распределяем по месту назначения
          switch (param.location) {
            case "query":
              requestParams.query[param.key] = value;
              break;
            case "headers":
              requestParams.headers[param.key] = value;
              break;
            case "body":
              if (!requestParams.body) {
                requestParams.body = {};
                if (param.contentType) {
                  requestParams.headers["Content-Type"] =
                    param.contentType === "json"
                      ? "application/json"
                      : param.contentType === "formdata"
                        ? "multipart/form-data"
                        : param.contentType === "x-www-form-urlencoded"
                          ? "application/x-www-form-urlencoded"
                          : "text/plain";
                }
              }
              requestParams.body[param.key] = value;
              break;
            case "path":
              url = url.replace(`:${param.key}`, encodeURIComponent(value));
              break;
          }
        }
      }

      // Выполняем запрос к устройству
      try {
        const response = await axios({
          method: action.method,
          url,
          params: requestParams.query,
          data: requestParams.body,
          headers: requestParams.headers,
          timeout: action.timeout,
        });

        // Регистрируем успешный вызов
        await action.registerCall(response.status);

        res.json({
          success: true,
          data: {
            action: {
              id: action.id,
              name: action.name,
            },
            device: {
              id: device.id,
              name: device.name,
            },
            request: {
              method: action.method,
              url,
              params: requestParams,
            },
            response: {
              status: response.status,
              data: response.data,
            },
          },
        });
      } catch (error) {
        await action.registerCall(error.response?.status || 500, error.message);
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    const transaction = await Action.sequelize.transaction();

    try {
      const action = await Action.findByPk(req.params.id, { transaction });

      if (!action) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Действие не найдено",
        });
      }

      const errors = actionValidator.validate(req.body, true);
      if (errors.length > 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, errors });
      }

      const updateData = { ...req.body };
      delete updateData.deviceId; 
      delete updateData.parameters; 

      await action.update(updateData, { transaction });

      if (req.body.parameters) {
        await ActionParameter.destroy({
          where: { action_id: action.id },
          transaction,
        });

        for (const param of req.body.parameters) {
          await ActionParameter.create(
            {
              ...param,
              actionId: action.id,
            },
            { transaction },
          );
        }
      }

      await transaction.commit();

      const updatedAction = await Action.findByPk(action.id, {
        include: [{ association: "parameters" }],
      });

      res.json({
        success: true,
        data: updatedAction,
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Удаление действия
  async delete(req, res, next) {
    const transaction = await Action.sequelize.transaction();

    try {
      const action = await Action.findByPk(req.params.id, { transaction });

      if (!action) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Действие не найдено",
        });
      }

      await action.destroy({ transaction });
      await transaction.commit();

      res.json({
        success: true,
        message: "Действие удалено",
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
}

module.exports = new ActionController();
