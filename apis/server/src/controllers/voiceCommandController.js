// controllers/voiceCommandController.js
const { VoiceCommand, Action } = require('../models');
const { voiceCommandValidator } = require('../helpers/validators');
const actionController = require('./actionController');
const PaginationHelper = require('../helpers/paginationHelper');
const { Op } = require('sequelize');

class VoiceCommandController {
  async getAll(req, res, next) {
    try {
      const {
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        filters
      } = PaginationHelper.getPaginationParams(req.query);

      const {
        search,
        actionId,
        deviceId,
        language,
        isActive,
        minPriority,
        maxPriority,
        minUsageCount,
        lastUsedFrom,
        lastUsedTo
      } = filters;

      const where = {};

      // Фильтр по действию
      if (actionId) {
        where.action_id = actionId;
      }

      // Фильтр по языку
      if (language) {
        where.language = language;
      }

      // Фильтр по активности
      if (isActive !== undefined) {
        where.is_active = isActive === 'true';
      }

      // Фильтр по приоритету
      if (minPriority !== undefined || maxPriority !== undefined) {
        where.priority = {};
        if (minPriority !== undefined) where.priority[Op.gte] = parseInt(minPriority);
        if (maxPriority !== undefined) where.priority[Op.lte] = parseInt(maxPriority);
      }

      // Фильтр по количеству использований
      if (minUsageCount !== undefined) {
        where.usage_count = { [Op.gte]: parseInt(minUsageCount) };
      }

      // Фильтр по дате последнего использования
      if (lastUsedFrom || lastUsedTo) {
        where.last_used = {};
        if (lastUsedFrom) where.last_used[Op.gte] = new Date(lastUsedFrom);
        if (lastUsedTo) where.last_used[Op.lte] = new Date(lastUsedTo);
      }

      // Поиск по тексту команды
      if (search) {
        where.command = { [Op.like]: `%${search.toLowerCase()}%` };
      }

      const include = [
        {
          model: Action,
          as: 'action',
          attributes: ['id', 'name', 'path', 'method'],
          include: deviceId ? [
            {
              model: Device,
              as: 'device',
              where: deviceId ? { id: deviceId } : {},
              attributes: ['id', 'name', 'ip']
            }
          ] : []
        }
      ];

      // Фильтр по устройству
      if (deviceId && !include[0].include) {
        include[0].include = [{
          model: Device,
          as: 'device',
          where: { id: deviceId },
          attributes: ['id', 'name', 'ip']
        }];
      }

      const allowedSortFields = [
        'command', 'language', 'priority', 'usageCount', 
        'lastUsed', 'createdAt', 'sortOrder'
      ];
      const order = PaginationHelper.getSortingParams(sortBy, sortOrder, allowedSortFields);

      const { count, rows } = await VoiceCommand.findAndCountAll({
        where,
        include,
        order,
        limit,
        offset,
        distinct: true
      });

      res.json({
        success: true,
        data: rows,
        pagination: PaginationHelper.getPaginationResponse(count, page, limit)
      });
    } catch (error) {
      next(error);
    }
  }

  async getByAction(req, res, next) {
    try {
      const commands = await VoiceCommand.findAll({
        where: { actionId: req.params.actionId },
        order: [['priority', 'DESC'], ['command', 'ASC']]
      });

      res.json({
        success: true,
        data: commands
      });
    } catch (error) {
      next(error);
    }
  }

 async process(req, res, next) {
    try {
      const { command, language = 'ru-RU' } = req.body;

      if (!command) {
        return res.status(400).json({
          success: false,
          message: 'Команда не передана'
        });
      }

      // 1. Находим голосовую команду по тексту
      const voiceCommand = await VoiceCommand.findOne({
        where: {
          command: command.toLowerCase().trim(),
          language,
          is_active: true
        },
        include: [{
          model: Action,
          as: 'action',
          required: true
        }]
      });

      if (!voiceCommand) {
        return res.status(404).json({
          success: false,
          message: 'Команда не найдена'
        });
      }

      // 2. Регистрируем использование голосовой команды
      await voiceCommand.registerUse();

      // 3. Перенаправляем на execute контроллера action
      // Создаем mock req/res для вызова actionController.execute
      const mockReq = {
        params: { id: voiceCommand.actionId },
        body: {},
        query: {}
      };

      const mockRes = {
        json: (data) => data,
        status: (code) => ({
          json: (data) => ({ ...data, statusCode: code })
        })
      };

      // 4. Выполняем действие
      const actionController = require('./actionController');
      const result = await actionController.execute(mockReq, mockRes, (err) => { throw err; });

      // 5. Возвращаем результат
      res.json({
        success: true,
        data: {
          voice_command: {
            id: voiceCommand.id,
            command: voiceCommand.command
          },
          action_result: result
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Создание голосовой команды (привязка текста к Action)
  async create(req, res, next) {
    try {
      const { actionId, command, language = 'ru-RU', priority = 0 } = req.body;

      // Проверяем существование действия
      const action = await Action.findByPk(actionId);
      if (!action) {
        return res.status(404).json({
          success: false,
          message: 'Действие не найдено'
        });
      }

      // Проверяем уникальность команды
      const existing = await VoiceCommand.findOne({
        where: {
          command: command.toLowerCase().trim(),
          language
        }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Такая команда уже существует'
        });
      }

      const voiceCommand = await VoiceCommand.create({
        actionId,
        command: command.toLowerCase().trim(),
        language,
        priority,
        isActive: true,
        usageCount: 0,
        parameters: {} // Больше не храним параметры здесь!
      });

      res.status(201).json({
        success: true,
        data: voiceCommand
      });

    } catch (error) {
      next(error);
    }
  }

  // Обновление команды
  async update(req, res, next) {
    try {
      const command = await VoiceCommand.findByPk(req.params.id);
      
      if (!command) {
        return res.status(404).json({
          success: false,
          message: 'Команда не найдена'
        });
      }

      const errors = await voiceCommandValidator.validate(
        { ...req.body, id: command.id, actionId: command.actionId }, 
        true
      );
      
      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      await command.update(req.body);

      res.json({
        success: true,
        data: command
      });
    } catch (error) {
      next(error);
    }
  }

  // Удаление команды
  async delete(req, res, next) {
    try {
      const command = await VoiceCommand.findByPk(req.params.id);
      
      if (!command) {
        return res.status(404).json({
          success: false,
          message: 'Команда не найдена'
        });
      }

      await command.destroy();

      res.json({
        success: true,
        message: 'Команда удалена'
      });
    } catch (error) {
      next(error);
    }
  }

  // Получение статистики команд
  async getStats(req, res, next) {
    try {
      const total = await VoiceCommand.count();
      const active = await VoiceCommand.scope('active').count();
      const byLanguage = await VoiceCommand.findAll({
        attributes: [
          'language',
          [VoiceCommand.sequelize.fn('COUNT', VoiceCommand.sequelize.col('language')), 'count']
        ],
        group: ['language']
      });

      res.json({
        success: true,
        data: {
          total,
          active,
          inactive: total - active,
          byLanguage: byLanguage.reduce((acc, item) => {
            acc[item.language] = parseInt(item.dataValues.count);
            return acc;
          }, {})
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VoiceCommandController();