// controllers/actionParameterController.js
const { ActionParameter, Action } = require('../models');
const { parameterValidator } = require('../helpers/validators');
const PaginationHelper = require('../helpers/paginationHelper');
const { Op } = require('sequelize');

class ActionParameterController {
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
        location,
        type,
        required,
        isActive,
        contentType
      } = filters;

      const where = {};

      // Фильтр по действию
      if (actionId) {
        where.action_id = actionId;
      }

      // Фильтр по местоположению
      if (location) {
        where.location = location;
      }

      // Фильтр по типу данных
      if (type) {
        where.type = type;
      }

      // Фильтр по обязательности
      if (required !== undefined) {
        where.required = required === 'true';
      }

      // Фильтр по активности
      if (isActive !== undefined) {
        where.is_active = isActive === 'true';
      }

      // Фильтр по Content-Type
      if (contentType) {
        where.content_type = contentType;
      }

      // Поиск по тексту
      if (search) {
        where[Op.or] = [
          { key: { [Op.like]: `%${search}%` } },
          { value: { [Op.like]: `%${search}%` } }
        ];
      }

      // Разрешенные поля для сортировки
      const allowedSortFields = [
        'key', 'location', 'type', 'required', 
        'contentType', 'createdAt', 'sortOrder'
      ];
      const order = PaginationHelper.getSortingParams(sortBy, sortOrder, allowedSortFields);

      const { count, rows } = await ActionParameter.findAndCountAll({
        where,
        include: [
          {
            model: Action,
            as: 'action',
            attributes: ['id', 'name', 'method', 'path']
          }
        ],
        order,
        limit,
        offset,
        distinct: true
      });

      // Добавляем типизированные значения
      const parametersWithTypedValues = rows.map(param => {
        const paramJson = param.toJSON();
        paramJson.typedValue = param.getTypedValue();
        return paramJson;
      });

      const grouped = {
        body: parametersWithTypedValues.filter(p => p.location === 'body'),
        query: parametersWithTypedValues.filter(p => p.location === 'query'),
        path: parametersWithTypedValues.filter(p => p.location === 'path'),
        headers: parametersWithTypedValues.filter(p => p.location === 'headers')
      };

      res.json({
        success: true,
        data: parametersWithTypedValues,
        grouped,
        pagination: PaginationHelper.getPaginationResponse(count, page, limit)
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    const transaction = await ActionParameter.sequelize.transaction();
    
    try {
      const errors = parameterValidator.validate(req.body);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors
        });
      }

      // Проверяем существование действия
      const action = await Action.findByPk(req.body.actionId);
      if (!action) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Действие не найдено'
        });
      }

      const parameter = await ActionParameter.create(req.body, { transaction });
      await transaction.commit();

      res.status(201).json({
        success: true,
        data: parameter
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Массовое создание параметров
  async bulkCreate(req, res, next) {
    const transaction = await ActionParameter.sequelize.transaction();
    
    try {
      const { actionId, parameters } = req.body;
      
      if (!Array.isArray(parameters)) {
        return res.status(400).json({
          success: false,
          message: 'Параметры должны быть массивом'
        });
      }

      // Проверяем существование действия
      const action = await Action.findByPk(actionId);
      if (!action) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Действие не найдено'
        });
      }

      // Валидируем каждый параметр
      const errors = [];
      for (const param of parameters) {
        const paramErrors = parameterValidator.validate({
          ...param,
          actionId
        });
        if (paramErrors.length > 0) {
          errors.push(...paramErrors.map(e => ({
            ...e,
            parameterKey: param.key
          })));
        }
      }

      if (errors.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          errors
        });
      }

      // Удаляем старые параметры и создаем новые
      await ActionParameter.destroy({
        where: { actionId },
        transaction
      });

      const createdParams = await ActionParameter.bulkCreate(
        parameters.map(p => ({ ...p, actionId })),
        { 
          transaction,
          validate: true 
        }
      );

      await transaction.commit();

      res.status(201).json({
        success: true,
        data: createdParams,
        count: createdParams.length
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Получение всех параметров действия
  async getByAction(req, res, next) {
    try {
      const { actionId } = req.params;
      const { location, required, type } = req.query;

      const where = { actionId };
      
      if (location) where.location = location;
      if (required !== undefined) where.required = required === 'true';
      if (type) where.type = type;

      const parameters = await ActionParameter.findAll({
        where,
        order: [
          ['location', 'ASC'],
          ['key', 'ASC']
        ]
      });

      // Группировка по location для удобства
      const grouped = {
        body: parameters.filter(p => p.location === 'body'),
        query: parameters.filter(p => p.location === 'query'),
        path: parameters.filter(p => p.location === 'path'),
        headers: parameters.filter(p => p.location === 'headers')
      };

      res.json({
        success: true,
        data: parameters,
        grouped,
        total: parameters.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Получение параметра по ID
  async getById(req, res, next) {
    try {
      const parameter = await ActionParameter.findByPk(req.params.id, {
        include: [{
          model: Action,
          as: 'action',
          attributes: ['id', 'name', 'path', 'method']
        }]
      });

      if (!parameter) {
        return res.status(404).json({
          success: false,
          message: 'Параметр не найден'
        });
      }

      // Добавляем типизированное значение
      const data = parameter.toJSON();
      data.typedValue = parameter.getTypedValue();

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  // Обновление параметра
  async update(req, res, next) {
    const transaction = await ActionParameter.sequelize.transaction();
    
    try {
      const parameter = await ActionParameter.findByPk(req.params.id, { transaction });
      
      if (!parameter) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Параметр не найден'
        });
      }
      
      if (errors.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          errors
        });
      }

      await parameter.update(req.body, { transaction });
      await transaction.commit();

      res.json({
        success: true,
        data: parameter
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Частичное обновление параметра
  async patch(req, res, next) {
    const transaction = await ActionParameter.sequelize.transaction();
    
    try {
      const parameter = await ActionParameter.findByPk(req.params.id, { transaction });
      
      if (!parameter) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Параметр не найден'
        });
      }

      // Разрешаем только определенные поля для patch
      const allowedFields = ['value', 'required', 'type', 'contentType'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await parameter.update(updateData, { transaction });
      await transaction.commit();

      res.json({
        success: true,
        data: parameter
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Удаление параметра
  async delete(req, res, next) {
    const transaction = await ActionParameter.sequelize.transaction();
    
    try {
      const parameter = await ActionParameter.findByPk(req.params.id, { transaction });
      
      if (!parameter) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Параметр не найден'
        });
      }

      await parameter.destroy({ transaction });
      await transaction.commit();

      res.json({
        success: true,
        message: 'Параметр удален'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Массовое удаление параметров действия
  async bulkDelete(req, res, next) {
    const transaction = await ActionParameter.sequelize.transaction();
    
    try {
      const { actionId, location, keys } = req.body;

      const where = {};
      if (actionId) where.actionId = actionId;
      if (location) where.location = location;
      if (keys && Array.isArray(keys)) where.key = { [Op.in]: keys };

      const deleted = await ActionParameter.destroy({
        where,
        transaction
      });

      await transaction.commit();

      res.json({
        success: true,
        message: `Удалено параметров: ${deleted}`,
        deleted
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Клонирование параметров из одного действия в другое
  async clone(req, res, next) {
    const transaction = await ActionParameter.sequelize.transaction();
    
    try {
      const { sourceActionId, targetActionId } = req.body;

      // Проверяем существование действий
      const [sourceAction, targetAction] = await Promise.all([
        Action.findByPk(sourceActionId),
        Action.findByPk(targetActionId)
      ]);

      if (!sourceAction) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Исходное действие не найдено'
        });
      }

      if (!targetAction) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Целевое действие не найдено'
        });
      }

      // Получаем параметры исходного действия
      const sourceParams = await ActionParameter.findAll({
        where: { actionId: sourceActionId }
      });

      if (sourceParams.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Нет параметров для клонирования'
        });
      }

      // Удаляем существующие параметры целевого действия
      await ActionParameter.destroy({
        where: { actionId: targetActionId },
        transaction
      });

      // Создаем клонированные параметры
      const clonedParams = await ActionParameter.bulkCreate(
        sourceParams.map(param => ({
          actionId: targetActionId,
          location: param.location,
          key: param.key,
          value: param.value,
          type: param.type,
          required: param.required,
          contentType: param.contentType
        })),
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: `Клонировано параметров: ${clonedParams.length}`,
        data: clonedParams
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Валидация значения параметра
  async validate(req, res, next) {
    try {
      const { value, type } = req.body;

      if (!value) {
        return res.status(400).json({
          success: false,
          message: 'Значение не передано'
        });
      }

      const isValid = parameterValidator.validateValue(value, type || 'string');
      
      let parsedValue = null;
      if (isValid) {
        switch (type) {
          case 'number':
            parsedValue = Number(value);
            break;
          case 'boolean':
            parsedValue = value === 'true' || value === true;
            break;
          case 'json':
          case 'array':
            try {
              parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
            } catch {
              parsedValue = value;
            }
            break;
          default:
            parsedValue = value;
        }
      }

      res.json({
        success: true,
        isValid,
        parsedValue,
        type
      });
    } catch (error) {
      next(error);
    }
  }

  // Получение статистики параметров
  async getStats(req, res, next) {
    try {
      const { actionId } = req.query;

      const where = {};
      if (actionId) where.actionId = actionId;

      const total = await ActionParameter.count({ where });
      
      const byLocation = await ActionParameter.findAll({
        where,
        attributes: [
          'location',
          [ActionParameter.sequelize.fn('COUNT', ActionParameter.sequelize.col('location')), 'count']
        ],
        group: ['location']
      });

      const byType = await ActionParameter.findAll({
        where,
        attributes: [
          'type',
          [ActionParameter.sequelize.fn('COUNT', ActionParameter.sequelize.col('type')), 'count']
        ],
        group: ['type']
      });

      const required = await ActionParameter.count({
        where: { ...where, required: true }
      });

      res.json({
        success: true,
        data: {
          total,
          required,
          optional: total - required,
          byLocation: byLocation.reduce((acc, item) => {
            acc[item.location] = parseInt(item.dataValues.count);
            return acc;
          }, {}),
          byType: byType.reduce((acc, item) => {
            acc[item.type] = parseInt(item.dataValues.count);
            return acc;
          }, {})
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Экспорт параметров в JSON
  async export(req, res, next) {
    try {
      const { actionId } = req.params;

      const parameters = await ActionParameter.findAll({
        where: { actionId },
        order: [['location', 'ASC'], ['key', 'ASC']],
        raw: true
      });

      const exportData = {
        actionId,
        exportedAt: new Date(),
        count: parameters.length,
        parameters: parameters.map(p => ({
          location: p.location,
          key: p.key,
          value: p.value,
          type: p.type,
          required: p.required,
          contentType: p.contentType
        }))
      };

      res.json({
        success: true,
        data: exportData
      });
    } catch (error) {
      next(error);
    }
  }

  // Импорт параметров из JSON
  async import(req, res, next) {
    const transaction = await ActionParameter.sequelize.transaction();
    
    try {
      const { actionId, parameters, overwrite = false } = req.body;

      if (!Array.isArray(parameters)) {
        return res.status(400).json({
          success: false,
          message: 'Параметры должны быть массивом'
        });
      }

      // Проверяем существование действия
      const action = await Action.findByPk(actionId);
      if (!action) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Действие не найдено'
        });
      }

      // Валидация импортируемых параметров
      const errors = [];
      for (const param of parameters) {
        const paramErrors = await parameterValidator.validate({
          ...param,
          actionId
        });
        if (paramErrors.length > 0) {
          errors.push(...paramErrors.map(e => ({
            ...e,
            parameterKey: param.key
          })));
        }
      }

      if (errors.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          errors
        });
      }

      // Если overwrite true, удаляем существующие параметры
      if (overwrite) {
        await ActionParameter.destroy({
          where: { actionId },
          transaction
        });
      }

      // Создаем новые параметры
      const createdParams = await ActionParameter.bulkCreate(
        parameters.map(p => ({ ...p, actionId })),
        { 
          transaction,
          validate: true,
          ignoreDuplicates: !overwrite
        }
      );

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: `Импортировано параметров: ${createdParams.length}`,
        data: createdParams
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
}

module.exports = new ActionParameterController();