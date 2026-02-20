const { VoiceCommand, Action, Device } = require('../models'); // 👈 ДОБАВИЛ Device!
const { voiceCommandValidator } = require('../helpers/validators');
const {actionController} = require('./action.controller');
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

      if (actionId) {
        where.action_id = actionId;
      }

      if (language) {
        where.language = language;
      }

      if (isActive !== undefined) {
        where.is_active = isActive === 'true';
      }

      if (minPriority !== undefined || maxPriority !== undefined) {
        where.priority = {};
        if (minPriority !== undefined) where.priority[Op.gte] = parseInt(minPriority);
        if (maxPriority !== undefined) where.priority[Op.lte] = parseInt(maxPriority);
      }

      if (minUsageCount !== undefined) {
        where.usage_count = { [Op.gte]: parseInt(minUsageCount) };
      }

      if (lastUsedFrom || lastUsedTo) {
        where.last_used = {};
        if (lastUsedFrom) where.last_used[Op.gte] = new Date(lastUsedFrom);
        if (lastUsedTo) where.last_used[Op.lte] = new Date(lastUsedTo);
      }

      if (search) {
        where.command = { [Op.like]: `%${search.toLowerCase()}%` };
      }

      const include = [
        {
          model: Action,
          as: 'action',
          attributes: ['id', 'name', 'path', 'method'],
          ...(deviceId && {
            include: [{
              model: Device,
              as: 'device',
              where: { id: deviceId },
              attributes: ['id', 'name', 'ip']
            }]
          })
        }
      ];

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
        where: { action_id: req.params.actionId }, 
        order: [
          ['priority', 'DESC'],
          ['command', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: commands
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const command = await VoiceCommand.findByPk(req.params.id, {
        include: [{
          model: Action,
          as: 'action',
          include: [{
            model: Device,
            as: 'device'
          }]
        }]
      });

      if (!command) {
        return res.status(404).json({
          success: false,
          message: 'Команда не найдена'
        });
      }

      res.json({
        success: true,
        data: command
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const errors = voiceCommandValidator.validate(req.body, false);
      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      const { actionId, command, language = 'ru-RU', priority = 0 } = req.body;

      const action = await Action.findByPk(actionId);
      if (!action) {
        return res.status(404).json({
          success: false,
          message: 'Действие не найдено'
        });
      }

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
        usageCount: 0
      });

      res.status(201).json({
        success: true,
        data: voiceCommand
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreate(req, res, next) {
    const transaction = await VoiceCommand.sequelize.transaction();

    try {
      const { actionId, commands } = req.body;

      if (!Array.isArray(commands)) {
        return res.status(400).json({
          success: false,
          message: 'Команды должны быть массивом'
        });
      }

      const action = await Action.findByPk(actionId);
      if (!action) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Действие не найдено'
        });
      }

      const errors = [];
      for (const cmd of commands) {
        const cmdErrors = voiceCommandValidator.validate({
          ...cmd,
          actionId
        }, false);

        if (cmdErrors.length > 0) {
          errors.push(...cmdErrors.map(e => ({
            ...e,
            commandText: cmd.command
          })));
        }
      }

      if (errors.length > 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, errors });
      }

      // Проверяем уникальность команд
      for (const cmd of commands) {
        const existing = await VoiceCommand.findOne({
          where: {
            command: cmd.command.toLowerCase().trim(),
            language: cmd.language || 'ru-RU'
          }
        });

        if (existing) {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: `Команда "${cmd.command}" уже существует`
          });
        }
      }

      const createdCommands = await VoiceCommand.bulkCreate(
        commands.map(cmd => ({
          actionId,
          command: cmd.command.toLowerCase().trim(),
          language: cmd.language || 'ru-RU',
          priority: cmd.priority || 0,
          isActive: cmd.isActive ?? true,
          usageCount: 0
        })),
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        success: true,
        data: createdCommands,
        count: createdCommands.length
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const command = await VoiceCommand.findByPk(req.params.id);

      if (!command) {
        return res.status(404).json({
          success: false,
          message: 'Команда не найдена'
        });
      }

      // 👈 ВАЛИДАЦИЯ С isUpdate = true!
      const errors = voiceCommandValidator.validate(req.body, true);
      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      // Проверяем уникальность команды если меняется текст
      if (req.body.command && req.body.command.toLowerCase().trim() !== command.command) {
        const existing = await VoiceCommand.findOne({
          where: {
            command: req.body.command.toLowerCase().trim(),
            language: req.body.language || command.language
          }
        });

        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'Такая команда уже существует'
          });
        }
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

  async bulkDelete(req, res, next) {
    const transaction = await VoiceCommand.sequelize.transaction();

    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Массив ID команд обязателен'
        });
      }

      const deleted = await VoiceCommand.destroy({
        where: {
          id: { [Op.in]: ids }
        },
        transaction
      });

      await transaction.commit();

      res.json({
        success: true,
        message: `Удалено команд: ${deleted}`,
        count: deleted
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async process(req, res, next) {
    try {
      const errors = voiceCommandValidator.validateProcess(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      const { command, language = 'ru-RU' } = req.body;

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

      await voiceCommand.registerUse();

      let executeResult = null;

      const mockReq = {
        params: { id: voiceCommand.actionId },
        body: {},
        query: {}
      };

      const mockRes = {
        json: (data) => {
          executeResult = data;
          return data;
        },
        status: (code) => ({
          json: (data) => {
            executeResult = { ...data, statusCode: code };
            return executeResult;
          }
        })
      };

      // Выполняем действие
      await actionController.execute(mockReq, mockRes, (err) => { throw err; });

      // Возвращаем ОБЪЕДИНЕННЫЙ ответ
      res.json({
        success: true,
        data: {
          voice_command: {
            id: voiceCommand.id,
            command: voiceCommand.command,
            language: voiceCommand.language,
            priority: voiceCommand.priority
          },
          action: {
            id: executeResult?.data?.action?.id || voiceCommand.actionId,
            name: executeResult?.data?.action?.name,
            method: executeResult?.data?.request?.method,
            url: executeResult?.data?.request?.url
          },
          device: executeResult?.data?.device,
          request: executeResult?.data?.request,
          response: executeResult?.data?.response
        }
      });
    } catch (error) {
      next(error);
    }
  }

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